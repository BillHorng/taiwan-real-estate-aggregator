import json
import sys
from datetime import datetime, timezone
from scripts import update_data

def test_failed_source_retains_previous_snapshot_and_records_health(tmp_path, monkeypatch):
    output = tmp_path / "properties.json"
    status = tmp_path / "sync-status.json"
    stamp = datetime.now(timezone.utc).isoformat()
    previous = {
        "schema_version":"test", "generated_at":stamp, "source_attribution":"test",
        "records":[{
            "id":"old-1", "source_id":"test-source", "source_name":"Test", "source_url":"https://example.gov.tw/data",
            "external_listing_id":"1", "title":"Old record", "description":None, "property_category":"land",
            "transaction_type":"government_sale", "county":None, "district":None, "address":None,
            "address_precision":"unknown", "latitude":None, "longitude":None, "location_precision":"none",
            "total_price":1, "unit_price":1, "building_area_ping":None, "land_area_ping":1, "building_age":None,
            "floor":None, "rooms":None, "bathrooms":None, "parking":None, "auction_type":None,
            "auction_round":None, "auction_date":None, "reserve_price":1, "final_price":None, "deposit":None,
            "case_number":None, "ownership_share":None, "handover_status":None, "listing_status":"upcoming",
            "first_seen_at":stamp, "last_seen_at":stamp, "last_verified_at":stamp, "source_updated_at":None,
            "data_quality_score":1, "duplicate_group_id":None, "source_details":{},
        }],
    }
    output.write_text(json.dumps(previous), encoding="utf-8")
    def fail(): raise TimeoutError("temporary outage")
    monkeypatch.setattr(update_data, "SOURCES", (("test-source", fail, lambda row, synced: row),))
    monkeypatch.setattr(sys, "argv", ["update_data.py", "--output", str(output), "--status-output", str(status)])
    assert update_data.main() == 0
    updated = json.loads(output.read_text(encoding="utf-8"))
    health = json.loads(status.read_text(encoding="utf-8"))
    assert len(updated["records"]) == 1
    assert health["overall"] == "stale"
    assert health["sources"]["test-source"]["status"] == "stale"
    assert "TimeoutError" in health["sources"]["test-source"]["error"]
