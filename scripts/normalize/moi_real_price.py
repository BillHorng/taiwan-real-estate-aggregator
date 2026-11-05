from __future__ import annotations
import hashlib
from datetime import date

PING_PER_SQM = 0.3025

def number(value: str | None) -> float | None:
    try:
        parsed = float((value or "").replace(",", "").strip())
        return parsed if parsed >= 0 else None
    except ValueError:
        return None

def integer(value: str | None) -> int | None:
    parsed = number(value)
    return int(parsed) if parsed is not None else None

def roc_date(value: str | None) -> date | None:
    digits = "".join(character for character in (value or "") if character.isdigit())
    if len(digits) < 7:
        return None
    digits = digits.zfill(7)
    try:
        return date(int(digits[:-4]) + 1911, int(digits[-4:-2]), int(digits[-2:]))
    except ValueError:
        return None

def building_age(transaction: date | None, completed: date | None) -> float | None:
    if not transaction or not completed or completed > transaction:
        return None
    return round((transaction - completed).days / 365.2425, 1)

def normalize(row: dict[str, str]) -> dict | None:
    transaction_date = roc_date(row.get("交易年月日"))
    total_price = number(row.get("總價元"))
    area_sqm = number(row.get("建物移轉總面積平方公尺"))
    land_sqm = number(row.get("土地移轉總面積平方公尺"))
    unit_sqm = number(row.get("單價元平方公尺"))
    serial = (row.get("編號") or "").strip()
    if not serial or not transaction_date or total_price is None:
        return None
    stable = hashlib.sha256(f"{row.get('縣市')}|{serial}|{row.get('移轉編號')}".encode()).hexdigest()[:20]
    completed = roc_date(row.get("建築完成年月"))
    return {
        "id": f"moi-lvr:{stable}", "source_id": "moi-lvr", "source_url": "https://data.gov.tw/dataset/25119",
        "county": (row.get("縣市") or "").strip(), "district": (row.get("鄉鎮市區") or "").strip(),
        "address": (row.get("土地位置建物門牌") or "").strip() or None, "transaction_date": transaction_date,
        "transaction_target": (row.get("交易標的") or "").strip(), "building_type": (row.get("建物型態") or "").strip() or None,
        "primary_use": (row.get("主要用途") or "").strip() or None, "total_price": total_price,
        "unit_price_sqm": unit_sqm, "unit_price_ping": round(unit_sqm / PING_PER_SQM, 2) if unit_sqm else None,
        "building_area_ping": round(area_sqm * PING_PER_SQM, 2) if area_sqm is not None else None,
        "land_area_ping": round(land_sqm * PING_PER_SQM, 2) if land_sqm is not None else None,
        "building_age": building_age(transaction_date, completed), "floor": (row.get("移轉層次") or "").strip() or None,
        "total_floors": (row.get("總樓層數") or "").strip() or None, "rooms": integer(row.get("建物現況格局-房")),
        "halls": integer(row.get("建物現況格局-廳")), "bathrooms": integer(row.get("建物現況格局-衛")),
        "parking_type": (row.get("車位類別") or "").strip() or None, "parking_price": number(row.get("車位總價元")),
        "notes": (row.get("備註") or "").strip() or None, "external_id": serial,
    }
