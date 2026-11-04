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

    print(json.dumps({
        "schema_version": payload.get("schema_version"),
        "records": len(records),
        "sources": dict(sorted(source_counts.items())),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
