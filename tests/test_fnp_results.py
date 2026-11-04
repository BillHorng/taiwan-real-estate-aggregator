from datetime import datetime, timezone

from scripts.connectors.fnp_results import flatten
from scripts.normalize.fnp_results import normalize, roc_date


NOW = datetime(2026, 11, 4, tzinfo=timezone.utc)


def sample_payload():
    return {
        "root": {"bid-info": {
            "description": {"name":"北區分署", "year":"115", "batch-no":"1", "bid-date":"115-11-01", "post-date":"115-10-01", "file":"https://example.gov.tw/result.odt"},
            "bid-list": {"row": {"bid": {"number":"1", "base-price":"1000000", "bid-price":"1250000", "bid-num":"2", "memo":"測試", "estate-list": {
                "land": {"estate": {"mark":"臺北市中正區測試段1地號", "area":"100", "use":"住宅區", "status":"全部"}},
                "building": {"estate": {"mark":"臺北市中正區測試段1建號", "area":"50", "use":"", "status":"全部"}},
            }}}},
        }},
    }


def test_flatten_preserves_one_bid_with_multiple_estates():
    rows = flatten(sample_payload())
    assert len(rows) == 1
    assert len(rows[0]["estates"]) == 2
    assert rows[0]["bid-price"] == "1250000"


def test_normalize_keeps_reserve_and_final_prices_separate():
    item = normalize(flatten(sample_payload())[0], NOW)
    assert item["reserve_price"] == 1_000_000
    assert item["final_price"] == 1_250_000
    assert item["land_area_ping"] == 30.25
    assert item["building_area_ping"] == 15.125
    assert item["property_category"] == "mixed"
    assert item["listing_status"] == "ended"
    assert item["auction_date"] == "2026-11-01"


def test_roc_date_rejects_invalid_values():
    assert roc_date("115-11-01") == "2026-11-01"
    assert roc_date("") is None
