import json
import logging
from datetime import date
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Query, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).resolve().parent / ".env")  # before importing agent: it reads ANTHROPIC_MODEL when imported

import agent  # noqa: E402
import db  # noqa: E402
import metrics  # noqa: E402

log = logging.getLogger(__name__)

app = FastAPI(title="Modern Furniture Co. Analytics")


@app.middleware("http")
async def reload_changed_data(request: Request, call_next):
    # new or edited CSVs appear on the next request, without restarting the server
    if request.url.path.startswith("/api/"):
        await run_in_threadpool(db.refresh)
    return await call_next(request)

# ponytail: Vite dev server only; list real origins when deploying
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def filters(
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
    product: str | None = Query(None, alias="productType"),
):
    lo, hi = metrics.data_range()  # no dates sent -> the full range that exists in the data
    return date_from or lo, date_to or hi, product


@app.get("/api/meta")
def meta():
    return metrics.get_meta()


@app.get("/api/kpis")
def kpis(f=Depends(filters)):
    return metrics.get_kpis(*f)


@app.get("/api/orders-trend")
def orders_trend(f=Depends(filters)):
    return metrics.get_orders_trend(*f)


@app.get("/api/revenue-cost")
def revenue_cost(f=Depends(filters)):
    return metrics.get_revenue_cost(f[0], f[1])  # ledger has no product column


@app.get("/api/product-mix")
def product_mix(f=Depends(filters)):
    return metrics.get_product_mix(*f)


@app.get("/api/delivery-status")
def delivery_status(f=Depends(filters)):
    return metrics.get_delivery_status(*f)


@app.get("/api/weekday")
def weekday(f=Depends(filters)):
    return metrics.get_weekday(*f)


@app.get("/api/stage-hours")
def stage_hours(f=Depends(filters)):
    return metrics.get_stage_hours(*f)


@app.get("/api/profit-by-product")
def profit_by_product(f=Depends(filters)):
    return metrics.get_profit_by_product(*f)


@app.get("/api/ontime-vs-resignations")
def ontime_vs_resignations(f=Depends(filters)):
    return metrics.get_ontime_vs_resignations(*f)




class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    context: dict | None = None  # what the dashboard is showing; checked again inside the agent


@app.get("/api/chat/status")
def chat_status():
    # lets the browser choose between the real agent and the built-in demo
    return {"configured": agent.is_configured(), "model": agent.MODEL}


@app.post("/api/chat")
def chat(req: ChatRequest):
    history = [m.model_dump() for m in req.messages]

    def events():
        try:
            for event in agent.run_agent(history, req.context):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception:
            # once streaming has started the HTTP status is fixed, so a failure travels as an event
            log.exception("chat failed")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Something went wrong while answering. Please try again.'})}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},  # no proxy buffering: words must arrive as written
    )
