from __future__ import annotations
import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.connectors.fnp import fetch as fetch_fnp
from scripts.connectors.fnp_results import fetch as fetch_fnp_results
from scripts.connectors.moj_enforcement import fetch as fetch_moj
from scripts.connectors.bot import fetch as fetch_bot
from scripts.connectors.taipei import fetch as fetch_taipei
from scripts.normalize.fnp import normalize as normalize_fnp
from scripts.normalize.fnp_results import normalize as normalize_fnp_results
from scripts.normalize.moj_enforcement import normalize as normalize_moj
from scripts.normalize.bot import normalize as normalize_bot
from scripts.normalize.taipei import normalize as normalize_taipei
from scripts.normalize.deduplicate import ensure_unique_ids, mark_duplicate_candidates
from scripts.validate.models import Property

SOURCES = (
    ("fnp-9655", fetch_fnp, normalize_fnp),
    ("fnp-results-13144", fetch_fnp_results, normalize_fnp_results),
    ("moj-enforcement-177351", fetch_moj, normalize_moj),
    ("bot-37335", fetch_bot, normalize_bot),
    ("taipei-finance-121364", fetch_taipei, normalize_taipei),
)

SAVED_INPUT_KEYS = {
    "fnp-9655": "fnp",
    "fnp-results-13144": "fnp_results",
    "moj-enforcement-177351": "moj",
    "bot-37335": "bot",
    "taipei-finance-121364": "taipei",
}

def read_json(path: Path) -> dict | None:
    try: return json.loads(path.read_text(encoding="utf-8-sig"))
    except (FileNotFoundError, json.JSONDecodeError): return None

def atomic_json(path: Path, payload: dict, *, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":")) if compact else json.dumps(payload, ensure_ascii=False, indent=2)
    temporary.write_text(serialized, encoding="utf-8")
    temporary.replace(path)

def previous_records(output: Path) -> list[dict]:
    candidates = (output, ROOT / "public/data/properties.json")
    for candidate in candidates:
        payload = read_json(candidate)
        if payload and isinstance(payload.get("records"), list): return payload["records"]
    return []

def sanitize_error(error: Exception) -> str:
    return f"{type(error).__name__}: {error}"[:500]

def write_chunked_dataset(output: Path, payload: dict) -> dict:
    records = payload["records"]
    chunk_dir = output.with_name("properties")
    chunks: list[dict] = []
    source_counts: dict[str, int] = {}

    for source_id, _, _ in SOURCES:
        source_records = [record for record in records if record["source_id"] == source_id]
        if not source_records:
            continue
        filename = f"{source_id}.json"
        chunk_payload = {
            "schema_version": payload["schema_version"],
            "generated_at": payload["generated_at"],
            "source_attribution": payload["source_attribution"],
            "records": source_records,
        }
        atomic_json(chunk_dir / filename, chunk_payload, compact=True)
        current_count = sum(record["listing_status"] != "ended" for record in source_records)
        chunks.append({
            "source_id": source_id,
            "path": f"data/properties/{filename}",
            "records": len(source_records),
            "current_records": current_count,
            "ended_records": len(source_records) - current_count,
        })
        source_counts[source_id] = len(source_records)

    current_records = [record for record in records if record["listing_status"] != "ended"]
    current_payload = {
        "schema_version": payload["schema_version"],
        "generated_at": payload["generated_at"],
        "source_attribution": payload["source_attribution"],
        "records": current_records,
    }
    atomic_json(chunk_dir / "current.json", current_payload, compact=True)

    statuses = {status: sum(record["listing_status"] == status for record in records) for status in ("upcoming", "ended", "suspended", "unknown")}
    manifest = {
        "schema_version": "1.0.0",
        "dataset_schema_version": payload["schema_version"],
        "generated_at": payload["generated_at"],
        "source_attribution": payload["source_attribution"],
        "current_path": "data/properties/current.json",
        "summary": {
            "records": len(records),
            "statuses": statuses,
            "with_final_price": sum(record.get("final_price") is not None for record in records),
            "total_value": sum(record.get("final_price") or record.get("reserve_price") or 0 for record in records),
            "counties": len({record["county"] for record in records if record.get("county")}),
        },
        "source_counts": source_counts,
        "chunks": chunks,
    }
    atomic_json(output.with_name("property-manifest.json"), manifest)
    return manifest

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="Saved object with fnp/fnp_results/moj/bot/taipei arrays")
    parser.add_argument("--output", type=Path, default=ROOT / "public/data/properties.json")
    parser.add_argument("--status-output", type=Path)
    args = parser.parse_args()
    status_output = args.status_output or args.output.with_name("sync-status.json")
    synced_at = datetime.now(timezone.utc)
    previous = previous_records(args.output)
    previous_by_source = {source_id: [item for item in previous if item.get("source_id") == source_id] for source_id, _, _ in SOURCES}
    old_status = read_json(status_output) or {}
    old_sources = old_status.get("sources", {})
    saved_input = read_json(args.input) if args.input else None
    records: list[dict] = []
    source_status: dict[str, dict] = {}
    success_count = 0

    for source_id, fetch, normalize in SOURCES:
        started = time.monotonic()
        try:
            if saved_input is not None:
                key = SAVED_INPUT_KEYS.get(source_id)
                if key is None:
                    raise ValueError(f"No saved-input key is configured for source {source_id}")
                raw = saved_input[key]
            else:
                raw = fetch()
            normalized = [item for row in raw if (item := normalize(row, synced_at)) is not None]
            if not normalized: raise ValueError("source returned zero usable records")
            records.extend(normalized); success_count += 1
            source_status[source_id] = {"status":"success", "records":len(normalized), "attempted_at":synced_at.isoformat(), "last_success_at":synced_at.isoformat(), "duration_ms":round((time.monotonic()-started)*1000), "error":None}
        except Exception as error:
            fallback = previous_by_source[source_id]
            records.extend(fallback)
            source_status[source_id] = {"status":"stale" if fallback else "failed", "records":len(fallback), "attempted_at":synced_at.isoformat(), "last_success_at":old_sources.get(source_id, {}).get("last_success_at"), "duration_ms":round((time.monotonic()-started)*1000), "error":sanitize_error(error)}

    if not records: raise RuntimeError("All sources failed and no previous records are available")
    records = ensure_unique_ids(mark_duplicate_candidates(records))
    valid = [Property.model_validate(record).model_dump(mode="json") | {k: v for k, v in record.items() if k not in Property.model_fields} for record in records]
    ids = [record["id"] for record in valid]
    if len(ids) != len(set(ids)): raise ValueError("Duplicate normalized IDs detected")
    overall = "healthy" if success_count == len(SOURCES) else "degraded" if success_count else "stale"
    payload = {"schema_version":"2.3.0", "generated_at":synced_at.isoformat(), "source_attribution":"財政部國有財產署、法務部行政執行署、臺灣銀行、臺北市政府財政局（政府資料開放授權條款第1版）", "records":valid}
    history = list(old_status.get("history", []))[-89:]
    history.append({"at":synced_at.isoformat(), "overall":overall, "records":len(valid), "sources":{key:value["status"] for key, value in source_status.items()}})
    status = {"schema_version":"1.0.0", "generated_at":synced_at.isoformat(), "overall":overall, "sources":source_status, "history":history}
    atomic_json(args.output, payload, compact=True)
    manifest = write_chunked_dataset(args.output, payload)
    atomic_json(status_output, status)
    print(json.dumps({"records":len(valid), "sources_successful":success_count, "chunks":len(manifest["chunks"]), "current_records":len([record for record in valid if record["listing_status"] != "ended"]), "overall":overall, "output":str(args.output), "status_output":str(status_output)}, ensure_ascii=False))
    return 0

if __name__ == "__main__": raise SystemExit(main())
