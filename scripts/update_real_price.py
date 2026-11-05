from __future__ import annotations
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.connectors.moi_real_price import URL, fetch
from scripts.normalize.moi_real_price import normalize
from scripts.validate.models import RealPriceRecord

def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temporary.replace(path)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-zip", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "public/data/real-price.json")
    args = parser.parse_args()
    raw, period = fetch(args.input_zip)
    records = [RealPriceRecord.model_validate(item).model_dump(mode="json") for row in raw if (item := normalize(row)) is not None]
    if not records:
        raise ValueError("official real-price archive returned zero valid records")
    ids = [record["id"] for record in records]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate real-price IDs detected")
    generated_at = datetime.now(timezone.utc).isoformat()
    payload = {"schema_version":"1.0.0", "generated_at":generated_at, "source_name":"內政部不動產交易實價登錄", "source_url":URL,
               "license":"政府資料開放授權條款-第1版", "period":period, "records":records}
    atomic_json(args.output, payload)
    print(json.dumps({"records":len(records), "counties":len({record["county"] for record in records}), "period":period, "output":str(args.output)}, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
