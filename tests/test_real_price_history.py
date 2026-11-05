from datetime import datetime, timezone
from scripts.update_real_price_history import aggregate, label, seasons_through_previous_quarter

def record(unit: float, total: float, building_type: str = "住宅大樓") -> dict:
    return {"county":"臺北市", "district":"大安區", "building_type":building_type, "transaction_target":"房地(土地+建物)",
            "building_area_ping":30, "unit_price_ping":unit, "total_price":total}

def test_builds_national_county_and_district_medians():
    points = aggregate("114S1", [record(800_000, 24_000_000), record(1_000_000, 30_000_000)])
    district = next(point for point in points if point["county"] == "臺北市" and point["district"] == "大安區" and point["building_type"] == "全部")
    assert district["count"] == 2
    assert district["median_unit_price"] == 900_000
    assert any(point["county"] == "全台" for point in points)

def test_season_range_ends_at_previous_quarter():
    assert seasons_through_previous_quarter(datetime(2026, 11, 5, tzinfo=timezone.utc))[-1] == "115S3"
    assert label("114S4") == "2025 Q4"
