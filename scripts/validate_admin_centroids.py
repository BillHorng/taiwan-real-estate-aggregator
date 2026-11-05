from __future__ import annotations

import json
import sys
from pathlib import Path

from pydantic import TypeAdapter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.validate.models import AdminCentroid


def main() -> int:
    path = ROOT / "public/data/admin-centroids.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("precision") != "district":
        raise ValueError("administrative centroid dataset must remain district-level")
    records = TypeAdapter(list[AdminCentroid]).validate_python(payload.get("records"))
    codes = [record.town_code for record in records]
    if len(records) < 350:
        raise ValueError(f"expected at least 350 districts, got {len(records)}")
    if len(codes) != len(set(codes)):
        raise ValueError("town codes must be unique")
    print(json.dumps({"records": len(records), "counties": len({record.county for record in records})}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
