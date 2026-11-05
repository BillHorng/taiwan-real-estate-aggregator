from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.update_data import read_json, write_chunked_dataset


def main() -> int:
    parser = argparse.ArgumentParser(description="Build lazy-load chunks from a validated full snapshot")
    parser.add_argument(
        "snapshot",
        nargs="?",
        type=Path,
        default=ROOT / "public/data/properties.json",
    )
    args = parser.parse_args()
    payload = read_json(args.snapshot)
    if not payload or not isinstance(payload.get("records"), list):
        raise ValueError("snapshot records must be an array")
    manifest = write_chunked_dataset(args.snapshot, payload)
    print(json.dumps({
        "records": manifest["summary"]["records"],
        "current_records": sum(manifest["summary"]["statuses"][status] for status in ("upcoming", "suspended", "unknown")),
        "chunks": len(manifest["chunks"]),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
