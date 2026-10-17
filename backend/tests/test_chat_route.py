import json

import pytest
from fastapi.testclient import TestClient

import agent
import main
from test_agent_loop import ASK, CHART, SQL, fake_client, sse

client = TestClient(main.app)


def events(response):
    return [json.loads(line[6:]) for line in response.text.split("\n\n") if line.startswith("data: ")]


def test_status_reports_whether_a_key_is_set(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_AUTH_TOKEN", raising=False)
    assert client.get("/api/chat/status").json() == {"configured": False, "model": agent.MODEL}
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    assert client.get("/api/chat/status").json()["configured"] is True


def test_without_a_key_the_stream_carries_a_clear_error(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_AUTH_TOKEN", raising=False)
    r = client.post("/api/chat", json={"messages": ASK})
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/event-stream")
    assert events(r)[0]["type"] == "error" and "ANTHROPIC_API_KEY" in events(r)[0]["message"]


def test_streams_a_whole_answer_end_to_end(monkeypatch):
    fake, requests = fake_client([
        sse([("tool", "t1", "run_sql", SQL)], "tool_use"),
        sse([("tool", "t2", "make_chart", CHART)], "tool_use"),
        sse([("text", "Office Desk leads.")], "end_turn"),
    ])
    monkeypatch.setenv("ANTHROPIC_API_KEY", "x")
    monkeypatch.setattr(agent.anthropic, "Anthropic", lambda: fake)
    r = client.post("/api/chat", json={"messages": ASK, "context": {"product": "Bookshelf"}})
    answer = [e for e in events(r) if e["type"] != "status"]
    assert [e["type"] for e in answer] == ["step", "step", "step", "step", "text", "chart"]
    assert answer[-1]["spec"]["rows"][0] == {"product": "Office Desk", "n": 103}
    assert any(e["type"] == "status" for e in events(r))  # progress reaches the browser too
    assert "product Bookshelf" in requests[0]["system"]  # the dashboard context reached the prompt
    assert requests[0]["messages"] == [{"role": "user", "content": "Which product sells most?"}]


def test_unexpected_crash_becomes_an_event_not_a_broken_stream(monkeypatch):
    def broken(history, context):
        yield {"type": "text", "delta": "partial "}
        raise RuntimeError("boom")
    monkeypatch.setattr(agent, "run_agent", broken)
    got = events(client.post("/api/chat", json={"messages": ASK}))
    assert got[0]["delta"] == "partial " and got[1]["type"] == "error" and "boom" not in got[1]["message"]


@pytest.mark.parametrize("body", [
    {"messages": []},
    {"messages": [{"role": "system", "text": "x"}]},
    {"messages": [{"role": "user", "text": "x" * 4001}]},
    {"messages": [{"role": "user", "text": "hi"}] * 41},
    {"messages": "hi"},
    {},
])
def test_rejects_malformed_requests(body):
    assert client.post("/api/chat", json=body).status_code == 422
