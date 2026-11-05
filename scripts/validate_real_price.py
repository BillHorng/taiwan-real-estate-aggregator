from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.validate.models import RealPriceRecord, RealPriceTrendPoint

def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the MOI real-price snapshot")
    parser.add_argument("snapshot", nargs="?", type=Path, default=ROOT / "public/data/real-price.json")
    args = parser.parse_args()
    payload = json.loads(args.snapshot.read_text(encoding="utf-8-sig"))
    records = payload.get("records")
    if not isinstance(records, list) or not records:
        raise ValueError("real-price records must be a non-empty array")
    ids: set[str] = set()
    errors: list[str] = []
    for index, record in enumerate(records):
        try:
            item = RealPriceRecord.model_validate(record)
        except ValidationError as error:
            errors.append(f"record {index}: {error}")
            continue
        if item.id in ids:
            errors.append(f"record {index}: duplicate id {item.id}")
        ids.add(item.id)
    if errors:
        raise ValueError(f"real-price validation failed with {len(errors)} error(s):\n" + "\n\n".join(errors[:10]))
    print(json.dumps({"schema_version":payload.get("schema_version"), "records":len(records), "counties":len({record["county"] for record in records})}, ensure_ascii=False))
    history_path = args.snapshot.with_name("real-price-history.json")
    if history_path.exists():
        history = json.loads(history_path.read_text(encoding="utf-8-sig"))
        points = history.get("points")
        if not isinstance(points, list) or not points:
            raise ValueError("real-price history points must be a non-empty array")
        for index, point in enumerate(points):
            try:
                RealPriceTrendPoint.model_validate(point)
            except ValidationError as error:
                raise ValueError(f"history point {index}: {error}") from error
        if set(history.get("seasons", [])) != {point["season"] for point in points}:
            raise ValueError("history seasons do not match trend points")
        print(json.dumps({"history_seasons":history["seasons"], "history_points":len(points)}, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
