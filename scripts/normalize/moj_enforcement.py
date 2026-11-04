from __future__ import annotations
import hashlib
from datetime import datetime
from scripts.connectors.moj_enforcement import DATASET_URL
from scripts.normalize.fnp import number

def roc_date(value):
    if not value: return None
    try:
        year, month, day = (int(part) for part in str(value).split("/"))
        return f"{year + 1911:04d}-{month:02d}-{day:02d}"
    except (ValueError, TypeError): return None

def normalize(row: dict, synced_at: datetime) -> dict:
    case_number = "".join(str(row.get(key) or "") for key in ("執行案號-年度", "執行案號-案件種類代碼", "執行案號-流水號"))
    address = str(row.get("地址") or "").strip() or None
    parcel = str(row.get("地號") or "").strip()
    title = address or parcel or f"行政執行拍賣紀錄 {case_number}"
    external = "|".join(str(value or "") for value in (case_number, row.get("標別"), title, row.get("地號"), row.get("面積-平方公尺"), row.get("拍賣底價"), row.get("拍定金額"), row.get("拍定日期")))
    digest = hashlib.sha256(external.encode("utf-8")).hexdigest()[:20]
    area_ping = number(row.get("面積-坪"))
    area_sqm = number(row.get("面積-平方公尺"))
    if area_ping is None and area_sqm is not None: area_ping = round(area_sqm * 0.3025, 4)
    reserve, final = number(row.get("拍賣底價")), number(row.get("拍定金額"))
    stamp = synced_at.isoformat()
    present = sum(v not in (None, "") for v in (address, row.get("縣市"), row.get("鄉鎮區"), reserve, final, area_ping, row.get("拍定日期"), row.get("網址")))
    return {
        "id": f"moj-{digest}", "source_id": "moj-enforcement-177351", "source_name": "法務部行政執行署", "source_url": row.get("網址") or DATASET_URL,
        "external_listing_id": digest, "title": title, "description": None, "property_category": "land" if row.get("拍賣類別") == "土地" else "unknown",
        "transaction_type": "auction", "county": row.get("縣市") or None, "district": row.get("鄉鎮區") or None, "address": address or parcel or None,
        "address_precision": "land_parcel" if parcel else "district" if row.get("鄉鎮區") else "unknown", "latitude": None, "longitude": None, "location_precision": "none",
        "total_price": final, "unit_price": round(final / area_ping, 2) if final and area_ping else None, "building_area_ping": None, "land_area_ping": area_ping,
        "building_age": None, "floor": None, "rooms": None, "bathrooms": None, "parking": None, "auction_type": row.get("拍賣類別") or "行政執行拍賣",
        "auction_round": None, "auction_date": roc_date(row.get("拍定日期")), "reserve_price": reserve, "final_price": final, "deposit": None, "case_number": case_number or None,
        "ownership_share": None, "handover_status": None, "listing_status": "ended", "first_seen_at": stamp, "last_seen_at": stamp, "last_verified_at": stamp,
        "source_updated_at": None, "data_quality_score": round(present / 8, 3), "duplicate_group_id": None,
        "source_details": {"agency": row.get("分署別"), "division": row.get("股別"), "sale_label": row.get("標別"), "purpose": row.get("用途"), "auction_round_text": row.get("拍次"), "dataset_url": DATASET_URL}
    }
