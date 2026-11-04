"""Administrative Enforcement Agency licensed cumulative auction-result dataset."""
from __future__ import annotations
import json
from urllib.request import Request, urlopen
from scripts.connectors.https import verified_context

DATASET_URL = "https://data.gov.tw/dataset/177351"
JSON_URL = "https://www.tpk.moj.gov.tw/media/20729227/%E4%B8%8D%E5%8B%95%E7%94%A2%E5%B7%B2%E6%8B%8D%E5%AE%9A%E6%A8%99%E7%9A%84%E8%B3%87%E6%96%99.json?mediaDL=true"

def fetch(timeout: int = 90) -> list[dict]:
    request = Request(JSON_URL, headers={"User-Agent": "TaiwanRealEstateAggregator/2.0 (open-data client)"})
    with urlopen(request, timeout=timeout, context=verified_context()) as response:
        if response.status != 200: raise RuntimeError(f"MOJ dataset returned HTTP {response.status}")
        payload = json.load(response)
    if not isinstance(payload, list): raise ValueError("MOJ payload must be a JSON array")
    return payload
