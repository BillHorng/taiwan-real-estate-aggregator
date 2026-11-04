from __future__ import annotations
import hashlib
import re
from datetime import datetime
from scripts.connectors.taipei import DATASET_URL
from scripts.normalize.fnp import number

def compact_roc_date(value):
    digits = "".join(char for char in str(value or "") if char.isdigit())
    if len(digits) != 7: return None
    try: return f"{int(digits[:3]) + 1911:04d}-{int(digits[3:5]):02d}-{int(digits[5:]):02d}"
    except ValueError: return None

def normalize(row: dict, synced_at: datetime) -> dict | None:
    if row.get("outcome") == "標租": return None
    address = str(row.get("address") or "").strip() or None
    mark = "、".join(value for value in (row.get("land_mark"), row.get("building_mark")) if value)
    external = "|".join(str(row.get(key) or "") for key in ("announcement_date", "tender_name", "land_mark", "building_mark", "address"))
    digest = hashlib.sha256(external.encode("utf-8")).hexdigest()[:20]
    land_sqm, building_sqm = number(row.get("land_area_sqm")), number(row.get("building_area_sqm"))
    reserve, final = number(row.get("reserve_price")), number(row.get("final_price"))
    status = "upcoming" if row.get("outcome") == "招標中" else "ended" if row.get("outcome") in ("已標脫", "再標售") else "unknown"
    district_match = re.search(r"([\u4e00-\u9fff]{2,4}區)", address or mark)
    stamp = synced_at.isoformat()
    present = sum(value not in (None, "") for value in (address, mark, land_sqm, building_sqm, reserve, row.get("announcement_date"), row.get("tender_name"), row.get("outcome")))
    return {
        "id": f"taipei-{digest}", "source_id": "taipei-finance-121364", "source_name": "臺北市政府財政局", "source_url": DATASET_URL, "external_listing_id": digest,
        "title": address or mark or row.get("tender_name") or "臺北市市有房地標售", "description": row.get("tender_name") or None,
        "property_category": "mixed" if land_sqm and building_sqm else "building" if building_sqm else "land" if land_sqm else "unknown", "transaction_type": "government_sale",
        "county": "臺北市", "district": district_match.group(1) if district_match else None,
        "address": address or mark or None, "address_precision": "land_parcel" if mark else "district" if address else "unknown", "latitude": None, "longitude": None, "location_precision": "none",
        "total_price": final or reserve, "unit_price": round((final or reserve) / ((building_sqm or land_sqm) * 0.3025), 2) if (final or reserve) and (building_sqm or land_sqm) else None,
        "building_area_ping": round(building_sqm * 0.3025, 4) if building_sqm is not None else None, "land_area_ping": round(land_sqm * 0.3025, 4) if land_sqm is not None else None,
        "building_age": None, "floor": None, "rooms": None, "bathrooms": None, "parking": None, "auction_type": "臺北市市有房地公開標售", "auction_round": None,
        "auction_date": None, "reserve_price": reserve, "final_price": final, "deposit": None, "case_number": None, "ownership_share": None, "handover_status": None,
        "listing_status": status, "first_seen_at": stamp, "last_seen_at": stamp, "last_verified_at": stamp, "source_updated_at": compact_roc_date(row.get("announcement_date")),
        "data_quality_score": round(present / 8, 3), "duplicate_group_id": None,
        "source_details": {"agency": "臺北市政府財政局", "land_mark": row.get("land_mark"), "building_mark": row.get("building_mark"), "outcome": row.get("outcome"), "dataset_url": DATASET_URL}
    }
