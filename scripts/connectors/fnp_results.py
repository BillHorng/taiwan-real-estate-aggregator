"""National Property Administration official real-estate tender results."""
from __future__ import annotations

import json
from urllib.request import Request, urlopen

from scripts.connectors.https import verified_context


DATASET_URL = "https://data.gov.tw/dataset/13144"
JSON_URL = "https://esvc.fnp.gov.tw/openDataSource?area=all&format=json&source=CftResult"


def flatten(payload: object) -> list[dict]:
    if not isinstance(payload, dict):
        raise ValueError("FNP result payload must be an object")

    rows: list[dict] = []
    for container in payload.values():
        if not isinstance(container, dict):
            continue
        bid_info = container.get("bid-info")
        if not isinstance(bid_info, dict):
            continue
        description = bid_info.get("description")
        bid_list = bid_info.get("bid-list")
        if not isinstance(description, dict) or not isinstance(bid_list, dict):
            continue

        for wrapper in bid_list.values():
            if not isinstance(wrapper, dict):
                continue
            bid = wrapper.get("bid")
            if not isinstance(bid, dict):
                continue
            estates: list[dict] = []
            estate_list = bid.get("estate-list")
            if isinstance(estate_list, dict):
                for estate_wrapper in estate_list.values():
                    if isinstance(estate_wrapper, dict) and isinstance(estate_wrapper.get("estate"), dict):
                        estates.append(estate_wrapper["estate"])
            rows.append({**description, **{key: value for key, value in bid.items() if key != "estate-list"}, "estates": estates})
    return rows


def fetch(timeout: int = 120) -> list[dict]:
    request = Request(JSON_URL, headers={"User-Agent": "TaiwanRealEstateAggregator/2.2 (open-data client)"})
    with urlopen(request, timeout=timeout, context=verified_context()) as response:
        if response.status != 200:
            raise RuntimeError(f"FNP result API returned HTTP {response.status}")
        payload = json.load(response)
    rows = flatten(payload)
    if not rows:
        raise ValueError("FNP result API returned no tender rows")
    return rows
