from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate.models import Property


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a generated property snapshot")
    parser.add_argument(
        "snapshot",
        nargs="?",
        type=Path,
        default=ROOT / "public/data/properties.json",
    )
    args = parser.parse_args()

    payload = json.loads(args.snapshot.read_text(encoding="utf-8-sig"))
    records = payload.get("records")
    if not isinstance(records, list):
        raise ValueError("snapshot records must be an array")

    errors: list[str] = []
    source_counts: Counter[str] = Counter()
    ids: set[str] = set()
    for index, record in enumerate(records):
        try:
            item = Property.model_validate(record)
        except ValidationError as error:
            errors.append(f"record {index}: {error}")
            continue
        if item.id in ids:
            errors.append(f"record {index}: duplicate id {item.id}")
        ids.add(item.id)
        source_counts[item.source_id] += 1

    if errors:
        preview = "\n\n".join(errors[:10])
        raise ValueError(f"snapshot validation failed with {len(errors)} error(s):\n{preview}")

    manifest_path = args.snapshot.with_name("property-manifest.json")
    chunk_count = 0
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
        if manifest.get("summary", {}).get("records") != len(records):
            raise ValueError("manifest total does not match snapshot records")
        chunk_ids: set[str] = set()
        public_root = manifest_path.parents[1]
        for chunk in manifest.get("chunks", []):
            chunk_path = public_root / chunk["path"]
            chunk_payload = json.loads(chunk_path.read_text(encoding="utf-8-sig"))
            chunk_records = chunk_payload.get("records")
            if not isinstance(chunk_records, list) or len(chunk_records) != chunk["records"]:
                raise ValueError(f"chunk count mismatch: {chunk_path}")
            if any(record.get("source_id") != chunk["source_id"] for record in chunk_records):
                raise ValueError(f"chunk source mismatch: {chunk_path}")
            chunk_ids.update(record["id"] for record in chunk_records)
            chunk_count += 1
        if chunk_ids != ids:
            raise ValueError("chunk IDs do not match full snapshot IDs")
        current_path = public_root / manifest["current_path"]
        current_payload = json.loads(current_path.read_text(encoding="utf-8-sig"))
        current_ids = {record["id"] for record in current_payload.get("records", [])}
        expected_current_ids = {record["id"] for record in records if record["listing_status"] != "ended"}
        if current_ids != expected_current_ids:
            raise ValueError("current chunk does not match non-ended snapshot records")

    print(json.dumps({
        "schema_version": payload.get("schema_version"),
        "records": len(records),
        "sources": dict(sorted(source_counts.items())),
        "chunks": chunk_count,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
