from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_registry() -> dict:
    return json.loads((ROOT / "public/data/source-registry.json").read_text(encoding="utf-8"))


def test_source_registry_has_unique_ids_and_https_urls() -> None:
    sources = load_registry()["sources"]
    ids = [source["id"] for source in sources]
    assert len(ids) == len(set(ids))
    assert all(source["official_url"].startswith("https://") for source in sources)


def test_general_listing_coverage_is_explicitly_link_only() -> None:
    sources = load_registry()["sources"]
    general_sources = [source for source in sources if "一般房源" in source["data_type"]]
    expected_ids = {
        "591", "yungching", "sinyi", "taiwan-realty", "hbhousing",
        "cthouse", "etwarm", "u-trust", "pacific",
    }
    assert {source["id"] for source in general_sources} == expected_ids
    assert all(source["integration_status"] == "official_link_only" for source in general_sources)
    assert all(source["has_open_download"] is False for source in general_sources)
    assert all("未取得" in source["license"] for source in general_sources)


def test_integrated_status_is_reserved_for_snapshot_sources() -> None:
    registry = load_registry()
    snapshot = json.loads((ROOT / "public/data/properties.json").read_text(encoding="utf-8"))
    snapshot_source_ids = {record["source_id"] for record in snapshot["records"]}
    real_price = json.loads((ROOT / "public/data/real-price.json").read_text(encoding="utf-8"))
    snapshot_source_ids.update(record["source_id"] for record in real_price["records"])
    admin_centroids = json.loads((ROOT / "public/data/admin-centroids.json").read_text(encoding="utf-8"))
    snapshot_source_ids.update(record["source_id"] for record in admin_centroids["records"])
    integrated_ids = {
        source["id"] for source in registry["sources"]
        if source["integration_status"] == "integrated"
    }
    assert integrated_ids == snapshot_source_ids
