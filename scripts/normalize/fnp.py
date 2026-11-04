from __future__ import annotations
import hashlib
import re
from datetime import date, datetime, timezone

PING_PER_SQM = 0.3025
TAIWAN_TZ = timezone.utc

def number(value):
    if value in (None, ""): return None
    try: return float(str(value).replace(",", ""))
    except ValueError: return None

def geography(mark: str):
    match = re.search(r"^(?P<county>.+?[縣市])(?P<district>.+?[區鄉鎮市])", mark or "")
    return (match.group("county"), match.group("district")) if match else (None, None)

def normalize(row: dict, synced_at: datetime) -> dict:
    mark = str(row.get("mark") or "").strip()
    county, district = geography(mark)
    area_sqm = number(row.get("area"))
    reserve = number(row.get("base-price"))
    bid_date = row.get("bid-date") or None
    stopped = str(row.get("stop") or "0") not in ("0", "", "false", "False")
    status = "suspended" if stopped else "unknown"
    if not stopped and bid_date:
        try: status = "upcoming" if date.fromisoformat(bid_date) >= synced_at.date() else "ended"
        except ValueError: pass
    external_key = "|".join(str(row.get(key) or "") for key in ("name", "year", "batch-no", "number", "mark"))
    digest = hashlib.sha256(external_key.encode("utf-8")).hexdigest()[:20]
    present = sum(value not in (None, "") for value in (mark, county, district, reserve, area_sqm, bid_date, row.get("bulletin-url"), row.get("earnest")))
    category = "mixed" if "建號" in mark and "地號" in mark else "building" if "建號" in mark else "land" if "地號" in mark else "unknown"
    stamp = synced_at.isoformat()
    return {
        "id": f"fnp-{digest}", "source_id": "fnp-9655", "source_name": "財政部國有財產署", "source_url": row.get("bulletin-url") or "https://data.gov.tw/dataset/9655",
        "external_listing_id": digest, "title": mark or f"國有非公用不動產標售（標號 {row.get('number') or '未提供'}）", "description": row.get("memo") or None,
        "property_category": category, "transaction_type": "government_sale", "county": county, "district": district, "address": mark or None,
        "address_precision": "land_parcel" if mark else "unknown", "latitude": None, "longitude": None, "location_precision": "none",
        "total_price": reserve, "unit_price": round(reserve / (area_sqm * PING_PER_SQM), 2) if reserve and area_sqm else None,
        "building_area_ping": None, "land_area_ping": round(area_sqm * PING_PER_SQM, 4) if area_sqm is not None else None,
        "building_age": None, "floor": None, "rooms": None, "bathrooms": None, "parking": None, "auction_type": "國有非公用財產標售",
        "auction_round": None, "auction_date": bid_date, "reserve_price": reserve, "final_price": None, "deposit": number(row.get("earnest")), "case_number": row.get("number") or None,
        "ownership_share": None, "handover_status": None, "listing_status": status, "first_seen_at": stamp, "last_seen_at": stamp, "last_verified_at": stamp,
        "source_updated_at": row.get("post-date") or None, "data_quality_score": round(present / 8, 3), "duplicate_group_id": None,
        "source_details": {"agency": row.get("name"), "year": row.get("year"), "batch_no": row.get("batch-no"), "type_code": row.get("type"), "use": row.get("use"), "notice_url": row.get("notice-url"), "sample_url": row.get("sample-url"), "image_reference": row.get("code")}
    }
