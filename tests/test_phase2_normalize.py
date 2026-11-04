from datetime import datetime, timezone
from scripts.normalize.bot import normalize as normalize_bot
from scripts.normalize.deduplicate import ensure_unique_ids, mark_duplicate_candidates
from scripts.normalize.moj_enforcement import normalize as normalize_moj, roc_date
from scripts.normalize.taipei import compact_roc_date, normalize as normalize_taipei
from scripts.connectors.https import verified_context
import ssl

NOW = datetime(2026, 11, 3, tzinfo=timezone.utc)

def test_roc_date():
    assert roc_date("115/03/09") == "2026-03-09"
    assert roc_date("") is None

def test_moj_keeps_reserve_and_final_prices_separate():
    row = {"縣市":"臺中市","鄉鎮區":"西區","地址":"臺中市西區測試路1號","地號":"1","面積-坪":"10","拍賣底價":"1000000","拍定金額":"1250000","拍定日期":"115/03/09","網址":"https://example.gov.tw/item"}
    item = normalize_moj(row, NOW)
    assert item["reserve_price"] == 1_000_000
    assert item["final_price"] == 1_250_000
    assert item["listing_status"] == "ended"

def test_bot_historical_record_is_not_upcoming():
    row = {"年度批號":"108年度第一批","編號":"1","不動產標示":"土地：屏東縣東港鎮嘉南段30地號","土地持分面積[平方公尺]":"100","標售底價[新台幣元]":"6000000"}
    assert normalize_bot(row, NOW)["listing_status"] == "ended"

def test_duplicate_rows_are_flagged_but_not_merged():
    records = [{"id":"same","source_id":"s","address":"A","land_area_ping":10,"reserve_price":1000000,"final_price":None,"duplicate_group_id":None} for _ in range(2)]
    result = ensure_unique_ids(mark_duplicate_candidates(records))
    assert len(result) == 2
    assert len({item["id"] for item in result}) == 2
    assert all(item["duplicate_group_id"] for item in result)
    assert all(item["duplicate_confidence"] == 1 for item in result)

def test_cross_source_near_match_is_flagged_but_price_mismatch_is_not():
    base = {"id":"a","source_id":"one","address":"台北市中山區測試路1號","building_area_ping":30,"land_area_ping":None,"reserve_price":10_000_000,"final_price":None,"total_price":10_000_000}
    near = {**base,"id":"b","source_id":"two","address":"臺北市中山區測試路 1 號","building_area_ping":30.2,"reserve_price":10_200_000,"total_price":10_200_000}
    far = {**base,"id":"c","source_id":"three","reserve_price":15_000_000,"total_price":15_000_000}
    result = mark_duplicate_candidates([base, near, far])
    assert result[0]["duplicate_group_id"] == result[1]["duplicate_group_id"]
    assert result[0]["duplicate_confidence"] == .94
    assert result[2]["duplicate_group_id"] is None

def test_taipei_only_marks_explicit_open_tender_as_upcoming():
    base = {"announcement_date":"1150624","tender_name":"測試標售","land_mark":"中山區測試段1地號","land_area_sqm":"100","building_mark":"","building_area_sqm":"","address":"臺北市中山區測試路1號","reserve_price":"1000000","final_price":"─"}
    assert compact_roc_date("1150624") == "2026-06-24"
    assert normalize_taipei(base | {"outcome":"招標中"}, NOW)["listing_status"] == "upcoming"
    assert normalize_taipei(base | {"outcome":"再標售"}, NOW)["listing_status"] == "ended"
    assert normalize_taipei(base | {"outcome":"標租"}, NOW) is None

def test_tls_context_keeps_certificate_and_hostname_verification():
    context = verified_context()
    assert context.verify_mode == ssl.CERT_REQUIRED
    assert context.check_hostname is True
