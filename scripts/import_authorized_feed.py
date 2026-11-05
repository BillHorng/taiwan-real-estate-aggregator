from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from scripts.update_data import atomic_json
from scripts.validate.models import Property

PROTECTED_FIELDS = {"description", "photos", "photo_urls", "image_urls"}


def read_records(path: Path) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    records = payload.get("records") if isinstance(payload, dict) else payload
    if not isinstance(records, list):
        raise ValueError("feed must be a JSON array or an object with a records array")
    return records


def validate_partner_feed(manifest: dict, records: list[dict]) -> list[dict]:
    required = ("source_id", "source_name", "permission_holder", "permission_reference", "verified_at", "permitted_fields")
    missing = [field for field in required if not manifest.get(field)]
    if missing:
        raise ValueError(f"permission manifest missing: {', '.join(missing)}")
    if manifest.get("redistribution_allowed") is not True:
        raise ValueError("redistribution_allowed must be explicitly true")
    permitted = set(manifest["permitted_fields"])
    validated: list[dict] = []
    for index, record in enumerate(records, start=1):
        if record.get("source_id") != manifest["source_id"] or record.get("source_name") != manifest["source_name"]:
            raise ValueError(f"record {index} source identity does not match permission manifest")
        if record.get("transaction_type") != "sale":
            raise ValueError(f"record {index} must use transaction_type sale")
        for field in PROTECTED_FIELDS:
            if record.get(field) and field not in permitted:
                raise ValueError(f"record {index} contains unlicensed field: {field}")
        validated.append(Property.model_validate(record).model_dump(mode="json"))
    return validated


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an explicitly authorized private listing feed")
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8-sig"))
    records = validate_partner_feed(manifest, read_records(args.input))
    payload = {
        "schema_version": "2.3.0", "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_attribution": manifest["source_name"],
        "permission": {"holder": manifest["permission_holder"], "reference": manifest["permission_reference"], "verified_at": manifest["verified_at"], "redistribution_allowed": True, "permitted_fields": manifest["permitted_fields"]},
        "records": records,
    }
    atomic_json(args.output, payload, compact=True)
    print(json.dumps({"source_id": manifest["source_id"], "records": len(records), "output": str(args.output)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
