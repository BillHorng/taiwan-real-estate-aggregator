"""Taipei Department of Finance licensed public-sale CSV connector."""
from __future__ import annotations
import csv
import io
from urllib.request import Request, urlopen
from scripts.connectors.https import verified_context

DATASET_URL = "https://data.gov.tw/dataset/121364"
CSV_URL = "https://data.taipei/api/dataset/44ddac08-8d2b-449f-b3a4-2e73aca55782/resource/1c9d765f-69e4-4c79-9645-42cbfb92f418/download"
FIELDS = ("announcement_date", "tender_name", "land_mark", "land_area_sqm", "building_mark", "building_area_sqm", "address", "reserve_price", "final_price", "outcome")

def fetch(timeout: int = 60) -> list[dict]:
    request = Request(CSV_URL, headers={"User-Agent": "TaiwanRealEstateAggregator/2.1 (open-data client)"})
    with urlopen(request, timeout=timeout, context=verified_context()) as response:
        if response.status != 200: raise RuntimeError(f"Taipei dataset returned HTTP {response.status}")
        text = response.read().decode("big5")
    rows = csv.reader(io.StringIO(text))
    next(rows, None)
    return [dict(zip(FIELDS, row)) for row in rows if len(row) >= len(FIELDS)]
