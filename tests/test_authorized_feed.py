from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from scripts.import_authorized_feed import main, validate_partner_feed

ROOT = Path(__file__).resolve().parents[1]


def permission() -> dict:
    return {"source_id": "authorized-partner", "source_name": "授權合作來源", "permission_holder": "Partner Co.", "permission_reference": "contract-2026-001", "verified_at": "2026-11-04", "redistribution_allowed": True, "permitted_fields": ["title", "source_url"]}


def sale_record() -> dict:
    snapshot = json.loads((ROOT / "public/data/properties.json").read_text(encoding="utf-8"))
    record = copy.deepcopy(snapshot["records"][0])
    record.update({"id": "authorized-partner:1", "source_id": "authorized-partner", "source_name": "授權合作來源", "source_url": "https://partner.example/listing/1", "external_listing_id": "1", "transaction_type": "sale", "listing_status": "unknown", "description": None})
    return record


def test_authorized_feed_requires_explicit_permission() -> None:
    with pytest.raises(ValueError, match="explicitly true"):
        validate_partner_feed(permission() | {"redistribution_allowed": False}, [sale_record()])


def test_authorized_feed_rejects_unlicensed_description() -> None:
    with pytest.raises(ValueError, match="unlicensed field: description"):
        validate_partner_feed(permission(), [sale_record() | {"description": "protected copy"}])


def test_authorized_feed_writes_validated_chunk(tmp_path, monkeypatch) -> None:
    manifest_path, feed_path, output_path = tmp_path / "permission.json", tmp_path / "feed.json", tmp_path / "authorized.json"
    manifest_path.write_text(json.dumps(permission(), ensure_ascii=False), encoding="utf-8")
    feed_path.write_text(json.dumps({"records": [sale_record()]}, ensure_ascii=False), encoding="utf-8")
    monkeypatch.setattr("sys.argv", ["import_authorized_feed.py", "--manifest", str(manifest_path), "--input", str(feed_path), "--output", str(output_path)])
    assert main() == 0
    output = json.loads(output_path.read_text(encoding="utf-8"))
    assert output["permission"]["reference"] == "contract-2026-001"
    assert output["records"][0]["source_id"] == "authorized-partner"
