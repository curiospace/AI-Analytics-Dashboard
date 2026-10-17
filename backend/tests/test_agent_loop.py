"""Runs the real agent loop through the real Anthropic SDK against a fake Claude server (httpx MockTransport)."""
import json

import anthropic
import httpx2 as httpx
import pytest

import agent


def sse(blocks, stop_reason):
    """A Messages API event stream. blocks: ("text", str) or ("tool", id, name, input_dict)."""
    ev = [{"type": "message_start", "message": {"id": "msg_1", "type": "message", "role": "assistant", "model": "m",
           "content": [], "stop_reason": None, "stop_sequence": None, "usage": {"input_tokens": 10, "output_tokens": 1}}}]
    for i, b in enumerate(blocks):
        if b[0] == "text":
            ev.append({"type": "content_block_start", "index": i, "content_block": {"type": "text", "text": ""}})
            ev.append({"type": "content_block_delta", "index": i, "delta": {"type": "text_delta", "text": b[1]}})
        else:
            ev.append({"type": "content_block_start", "index": i, "content_block": {"type": "tool_use", "id": b[1], "name": b[2], "input": {}}})
            ev.append({"type": "content_block_delta", "index": i, "delta": {"type": "input_json_delta", "partial_json": json.dumps(b[3])}})
        ev.append({"type": "content_block_stop", "index": i})
    ev.append({"type": "message_delta", "delta": {"stop_reason": stop_reason, "stop_sequence": None}, "usage": {"output_tokens": 20}})
    ev.append({"type": "message_stop"})
    body = "".join(f"event: {e['type']}\ndata: {json.dumps(e)}\n\n" for e in ev)
    return httpx.Response(200, headers={"content-type": "text/event-stream"}, content=body.encode())


def fake_client(turns):
    """turns: responses in order (httpx.Response or callable). Returns (client, list of request bodies)."""
    requests, queue = [], list(turns)

    def handler(request):
        requests.append(json.loads(request.content))
        turn = queue.pop(0) if len(queue) > 1 else queue[0]  # the last one repeats
        return turn(request) if callable(turn) else turn

    http = httpx.Client(transport=httpx.MockTransport(handler))
    return anthropic.Anthropic(api_key="test", http_client=http, max_retries=0), requests


ASK = [{"role": "user", "text": "Which product sells most?"}]
SQL = {"sql": "SELECT productType AS product, count(*) AS n FROM orders_data WHERE status <> 'LOST' GROUP BY 1 ORDER BY 2 DESC"}
CHART = {"result_id": "r1", "type": "hbar", "x": "product", "y": ["n"], "title": "Orders by product"}


def kinds(events):
    return [(e["type"], e.get("label") or e.get("delta") or e.get("message") or "") for e in without_status(events)]


def without_status(events):
    return [e for e in events if e["type"] != "status"]


def test_full_flow_query_chart_answer():
    client, requests = fake_client([
        sse([("text", "Let me check. "), ("tool", "t1", "run_sql", SQL)], "tool_use"),
        sse([("tool", "t2", "make_chart", CHART)], "tool_use"),
        sse([("text", "Office Desk leads with 103 orders.")], "end_turn"),
    ])
    events = without_status(agent.run_agent(ASK, {"product": "Bookshelf"}, client))

    types = [e["type"] for e in events]
    # the chart is held back until the answer text is written, so the answer reads top to bottom
    assert types == ["text", "step", "step", "step", "step", "text", "chart"]
    assert events[1] == {"type": "step", "label": "run_sql · orders_data", "done": False}
    assert events[2]["done"] is True and events[3]["label"] == "make_chart · hbar"
    chart = next(e["spec"] for e in events if e["type"] == "chart")
    assert chart["rows"][0] == {"product": "Office Desk", "n": 103}
    assert events[-2]["delta"] == "Office Desk leads with 103 orders."

    assert len(requests) == 3
    first = requests[0]
    assert first["model"] == agent.MODEL and first["stream"] is True and first["max_tokens"] == 16000
    assert [t["name"] for t in first["tools"]] == ["run_sql", "make_chart"]
    assert "orders_data (1166 rows)" in first["system"] and "product Bookshelf" in first["system"]
    assert "tool_choice" not in first and first["output_config"] == {"effort": "medium"}
    # second request: the assistant tool call and ITS result, in one user message, ids matching
    msgs = requests[1]["messages"]
    assert [m["role"] for m in msgs] == ["user", "assistant", "user"]
    assert any(b["type"] == "tool_use" and b["id"] == "t1" for b in msgs[1]["content"])
    assert msgs[2]["content"][0]["tool_use_id"] == "t1" and "result_id: r1" in msgs[2]["content"][0]["content"]


def test_tool_error_goes_back_to_the_model_which_continues():
    client, requests = fake_client([
        sse([("tool", "t1", "run_sql", {"sql": "DROP TABLE orders_data"})], "tool_use"),
        sse([("text", "Sorry, I can only read data.")], "end_turn"),
    ])
    events = without_status(agent.run_agent(ASK, None, client))
    assert [e["type"] for e in events] == ["step", "step", "text"]
    result = requests[1]["messages"][-1]["content"][0]
    assert result["is_error"] is True and "Only a single SELECT" in result["content"]


def test_parallel_tool_calls_return_in_one_message():
    client, requests = fake_client([
        sse([("tool", "a", "run_sql", {"sql": "SELECT 1 AS x"}), ("tool", "b", "run_sql", {"sql": "SELECT 2 AS x"})], "tool_use"),
        sse([("text", "done")], "end_turn"),
    ])
    list(agent.run_agent(ASK, None, client))
    last = requests[1]["messages"][-1]
    assert last["role"] == "user" and [r["tool_use_id"] for r in last["content"]] == ["a", "b"]


def test_stops_after_max_turns():
    client, requests = fake_client([sse([("tool", "t", "run_sql", {"sql": "SELECT 1"})], "tool_use")])
    events = without_status(agent.run_agent(ASK, None, client))
    assert len(requests) == agent.MAX_TURNS
    assert events[-1]["type"] == "error" and "too many steps" in events[-1]["message"]
    assert [e for e in events if e["type"] == "error"] == [events[-1]]  # exactly one, at the end


def test_refusal_and_cut_off_are_not_run_as_tools():
    refused, _ = fake_client([sse([("tool", "t", "run_sql", {"sql": "SELECT 1"})], "refusal")])
    assert kinds(agent.run_agent(ASK, None, refused)) == [("text", "I can't help with that request.")]
    cut, requests = fake_client([sse([("tool", "t", "run_sql", {"sql": "SELECT 1"})], "max_tokens")])
    events = without_status(agent.run_agent(ASK, None, cut))
    assert [e["type"] for e in events] == ["error"] and len(requests) == 1  # nothing was executed


@pytest.mark.parametrize("status, expected", [
    (401, "key was rejected"), (429, "busy"), (500, "error (500)"), (400, "error (400)"),
])
def test_api_errors_become_messages(status, expected):
    body = {"type": "error", "error": {"type": "api_error", "message": "x"}}
    client, _ = fake_client([httpx.Response(status, json=body)])
    events = without_status(agent.run_agent(ASK, None, client))
    assert len(events) == 1 and events[0]["type"] == "error" and expected in events[0]["message"]


def test_connection_failure_becomes_a_message():
    def boom(request):
        raise httpx.ConnectError("no network")
    client, _ = fake_client([boom])
    events = without_status(agent.run_agent(ASK, None, client))
    assert "Could not reach" in events[0]["message"]


def test_missing_key_is_a_message_not_a_crash(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_AUTH_TOKEN", raising=False)
    events = list(agent.run_agent(ASK, None))
    assert events[0]["type"] == "error" and "ANTHROPIC_API_KEY" in events[0]["message"]


def test_history_is_cleaned_and_must_end_with_a_question():
    msgs = agent.to_api_messages([
        {"role": "assistant", "text": "stray first"}, {"role": "user", "text": " hi "},
        {"role": "assistant", "text": ""}, {"role": "system", "text": "x"}, {"role": "assistant", "text": "yo"},
    ])
    assert msgs == [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "yo"}]
    assert [e["type"] for e in agent.run_agent([{"role": "assistant", "text": "yo"}], None)] == ["error"]
    assert [e["type"] for e in agent.run_agent([], None)] == ["error"]


def test_progress_is_reported_through_the_silent_stretches():
    client, _ = fake_client([
        sse([("tool", "t1", "run_sql", SQL)], "tool_use"),
        sse([("tool", "t2", "make_chart", CHART)], "tool_use"),
        sse([("text", "Office Desk leads.")], "end_turn"),
    ])
    events = list(agent.run_agent(ASK, None, client))
    statuses = [e["text"] for e in events if e["type"] == "status"]
    # each model call announces itself, and each tool as soon as the model starts writing it
    assert statuses == ["Reading the question", "Writing a query", "Reading the results", "Drawing a chart", "Reading the results"]
    # nothing arrives after the chart: it comes last, after the text
    assert [e["type"] for e in events][-2:] == ["text", "chart"]


def test_charts_already_drawn_survive_a_later_failure():
    client, _ = fake_client([
        sse([("tool", "t1", "run_sql", SQL)], "tool_use"),
        sse([("tool", "t2", "make_chart", CHART)], "tool_use"),
        sse([("tool", "t3", "run_sql", {"sql": "SELECT 1"})], "max_tokens"),
    ])
    events = without_status(agent.run_agent(ASK, None, client))
    assert [e["type"] for e in events][-2:] == ["chart", "error"]
