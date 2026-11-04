"""Bank of Taiwan official OpenData API connector."""
from __future__ import annotations
import json
from urllib.request import Request, urlopen
from scripts.connectors.https import verified_context

DETAIL_URL = "https://govdata.bot.com.tw/37335/2"
DATASET_URL = "https://data.gov.tw/dataset/37335"

def fetch(timeout: int = 60) -> list[dict]:
    request = Request(DETAIL_URL, headers={"User-Agent": "TaiwanRealEstateAggregator/2.0 (open-data client)"})
    with urlopen(request, timeout=timeout, context=verified_context()) as response:
        if response.status != 200: raise RuntimeError(f"BOT API returned HTTP {response.status}")
        payload = json.load(response)
    records = payload.get("result", {}).get("records") if isinstance(payload, dict) else None
    if not isinstance(records, list): raise ValueError("BOT payload result.records must be an array")
    return records
