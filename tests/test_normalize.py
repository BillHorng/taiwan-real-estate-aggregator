from datetime import datetime, timezone
import pytest
from pydantic import ValidationError
from scripts.normalize.fnp import geography, normalize
from scripts.validate.models import Property

def test_geography():
    assert geography("臺中市太平區孝平段0533-0002地號") == ("臺中市", "太平區")

def test_normalize_does_not_invent_location():
    result = normalize({"mark":"臺中市太平區孝平段0533-0002地號","area":"38","base-price":"2685460","stop":"0","bid-date":"2026-11-04","bulletin-url":"https://example.gov.tw/a.pdf"}, datetime(2026,11,3,tzinfo=timezone.utc))
    assert result["latitude"] is None and result["longitude"] is None
    assert result["listing_status"] == "upcoming"
    assert result["land_area_ping"] == 11.495

def test_stopped_has_priority_over_date():
    result = normalize({"mark":"臺北市中正區測試段1地號","stop":"1","bid-date":"2030-01-01"}, datetime(2026,11,3,tzinfo=timezone.utc))
    assert result["listing_status"] == "suspended"

def test_property_schema_rejects_partial_coordinates():
    result = normalize({"mark":"臺北市中正區測試段1地號","stop":"0"}, datetime(2026,11,3,tzinfo=timezone.utc))
    result["latitude"] = 25.03
    result["location_precision"] = "approximate"
    with pytest.raises(ValidationError, match="latitude and longitude"):
        Property.model_validate(result)
