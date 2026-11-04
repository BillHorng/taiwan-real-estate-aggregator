from __future__ import annotations
import hashlib
import re
from datetime import datetime
from scripts.connectors.bot import DATASET_URL
from scripts.normalize.fnp import number, geography

def normalize(row: dict, synced_at: datetime) -> dict:
    mark = str(row.get("不動產標示") or "").strip()
    county, district = geography(mark.replace("土地：", ""))
    digest = hashlib.sha256("|".join((str(row.get("年度批號") or ""), str(row.get("編號") or ""), mark)).encode("utf-8")).hexdigest()[:20]
    land_sqm, building_sqm = number(row.get("土地持分面積[平方公尺]")), number(row.get("建物持分面積[平方公尺]"))
    reserve = number(row.get("標售底價[新台幣元]"))
    batch_year = re.search(r"(\d{3})年度", str(row.get("年度批號") or ""))
    source_year = f"{int(batch_year.group(1)) + 1911}-01-01" if batch_year else None
    stamp = synced_at.isoformat()
    return {
        "id": f"bot-{digest}", "source_id": "bot-37335", "source_name": "臺灣銀行", "source_url": DATASET_URL, "external_listing_id": digest,
        "title": mark or "臺灣銀行不動產標售", "description": row.get("備註") or None, "property_category": "mixed" if land_sqm and building_sqm else "building" if building_sqm else "land" if land_sqm else "unknown",
        "transaction_type": "government_sale", "county": county, "district": district, "address": mark or None, "address_precision": "land_parcel" if mark else "unknown",
        "latitude": None, "longitude": None, "location_precision": "none", "total_price": reserve, "unit_price": round(reserve / ((land_sqm or building_sqm) * 0.3025), 2) if reserve and (land_sqm or building_sqm) else None,
        "building_area_ping": round(building_sqm * 0.3025, 4) if building_sqm is not None else None, "land_area_ping": round(land_sqm * 0.3025, 4) if land_sqm is not None else None,
        "building_age": None, "floor": None, "rooms": None, "bathrooms": None, "parking": None, "auction_type": "臺灣銀行不動產標售", "auction_round": None,
        "auction_date": None, "reserve_price": reserve, "final_price": None, "deposit": number(row.get("保證金金額[新台幣元]")), "case_number": str(row.get("編號") or "") or None,
        "ownership_share": None, "handover_status": None, "listing_status": "ended", "first_seen_at": stamp, "last_seen_at": stamp, "last_verified_at": stamp,
        "source_updated_at": source_year, "data_quality_score": 0.75, "duplicate_group_id": None,
        "source_details": {"agency": "臺灣銀行股份有限公司", "batch": row.get("年度批號"), "use": row.get("使用分區[僅供參考]"), "dataset_url": DATASET_URL}
    }
