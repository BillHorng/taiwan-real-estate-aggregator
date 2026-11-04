from __future__ import annotations

import hashlib
from datetime import datetime

from scripts.connectors.fnp_results import DATASET_URL
from scripts.normalize.fnp import geography, number


def roc_date(value: object) -> str | None:
    if not value:
        return None
    try:
        year, month, day = (int(part) for part in str(value).split("-"))
        return f"{year + 1911:04d}-{month:02d}-{day:02d}"
    except (TypeError, ValueError):
        return None


def normalize(row: dict, synced_at: datetime) -> dict:
    estates = [estate for estate in row.get("estates", []) if isinstance(estate, dict)]
    marks = [str(estate.get("mark") or "").strip() for estate in estates]
    marks = [mark for mark in marks if mark]
    first_mark = marks[0] if marks else ""
    county, district = geography(first_mark)

    land_sqm = sum(number(estate.get("area")) or 0 for estate in estates if "建號" not in str(estate.get("mark") or ""))
    building_sqm = sum(number(estate.get("area")) or 0 for estate in estates if "建號" in str(estate.get("mark") or ""))
    reserve = number(row.get("base-price"))
    final = number(row.get("bid-price"))
    total_area_ping = (land_sqm + building_sqm) * 0.3025
    display_price = final if final is not None else reserve
    bid_date = roc_date(row.get("bid-date"))
    number_text = str(row.get("number") or "").strip()
    external_key = "|".join(str(row.get(key) or "") for key in ("name", "year", "batch-no", "number", "bid-date"))
    digest = hashlib.sha256(external_key.encode("utf-8")).hexdigest()[:20]
    category = "mixed" if land_sqm and building_sqm else "building" if building_sqm else "land" if land_sqm else "unknown"
    title = first_mark or f"國有非公用不動產開標結果（標號 {number_text or '未提供'}）"
    if len(marks) > 1:
        title = f"{title} 等 {len(marks)} 筆標的"
    stamp = synced_at.isoformat()
    present = sum(value not in (None, "", []) for value in (row.get("name"), bid_date, number_text, reserve, row.get("bid-num"), marks, land_sqm or building_sqm, row.get("file")))
    statuses = sorted({str(estate.get("status")) for estate in estates if estate.get("status") not in (None, "")})

    return {
        "id": f"fnp-result-{digest}", "source_id": "fnp-results-13144", "source_name": "財政部國有財產署開標結果",
        "source_url": row.get("file") or DATASET_URL, "external_listing_id": digest, "title": title,
        "description": row.get("memo") or None, "property_category": category, "transaction_type": "government_sale",
        "county": county, "district": district, "address": "、".join(marks) or None,
        "address_precision": "land_parcel" if marks else "unknown", "latitude": None, "longitude": None, "location_precision": "none",
        "total_price": display_price, "unit_price": round(display_price / total_area_ping, 2) if display_price and total_area_ping else None,
        "building_area_ping": round(building_sqm * 0.3025, 4) if building_sqm else None,
        "land_area_ping": round(land_sqm * 0.3025, 4) if land_sqm else None,
        "building_age": None, "floor": None, "rooms": None, "bathrooms": None, "parking": None,
        "auction_type": "國有非公用財產標售開標結果", "auction_round": None, "auction_date": bid_date,
        "reserve_price": reserve, "final_price": final, "deposit": None, "case_number": number_text or None,
        "ownership_share": None, "handover_status": None, "listing_status": "ended", "first_seen_at": stamp,
        "last_seen_at": stamp, "last_verified_at": stamp, "source_updated_at": roc_date(row.get("post-date")),
        "data_quality_score": round(present / 8, 3), "duplicate_group_id": None,
        "source_details": {
            "agency": row.get("name"), "year": row.get("year"), "batch_no": row.get("batch-no"),
            "type_code": row.get("type"), "bid_count": str(row.get("bid-num")) if row.get("bid-num") not in (None, "") else None,
            "estate_count": str(len(estates)), "estate_statuses": "、".join(statuses) or None, "dataset_url": DATASET_URL,
        },
    }
