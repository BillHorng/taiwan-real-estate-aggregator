"""Official National Property Administration open-data connector."""
from __future__ import annotations
import json
from urllib.request import Request, urlopen
from scripts.connectors.https import verified_context

API_URL = "https://od.fnp.gov.tw/api/Json/9655"

def fetch(timeout: int = 60) -> list[dict]:
    request = Request(API_URL, headers={"User-Agent": "TaiwanRealEstateAggregator/1.0 (open-data client)"})
    with urlopen(request, timeout=timeout, context=verified_context()) as response:
        if response.status != 200:
            raise RuntimeError(f"FNP API returned HTTP {response.status}")
        payload = json.load(response)
    if not isinstance(payload, list):
        raise ValueError("FNP API payload must be a JSON array")
    return payload
