from __future__ import annotations
import argparse
import json
import statistics
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.connectors.moi_real_price import download_season, read_zip
from scripts.normalize.moi_real_price import normalize
from scripts.validate.models import RealPriceRecord

START_YEAR, START_QUARTER = 2025, 1

def seasons_through_previous_quarter(now: datetime) -> list[str]:
    year, quarter = now.year, (now.month - 1) // 3 + 1
    if quarter == 1:
        year, quarter = year - 1, 4
    else:
        quarter -= 1
    result: list[str] = []
    cursor_year, cursor_quarter = START_YEAR, START_QUARTER
    while (cursor_year, cursor_quarter) <= (year, quarter):
        result.append(f"{cursor_year - 1911:03d}S{cursor_quarter}")
        cursor_quarter += 1
        if cursor_quarter == 5:
            cursor_year, cursor_quarter = cursor_year + 1, 1
    return result

def label(season: str) -> str:
    return f"{int(season[:3]) + 1911} Q{season[-1]}"

def usable(record: dict) -> bool:
    return record.get("transaction_target") != "車位" and (record.get("building_area_ping") or 0) > 0 and (record.get("unit_price_ping") or 0) > 0

def aggregate(season: str, records: list[dict]) -> list[dict]:
    groups: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for record in records:
        if not usable(record):
            continue
        building_types = ("全部", record.get("building_type") or "未分類")
        locations = (("全台", "全部"), (record["county"], "全部"), (record["county"], record["district"]))
        for county, district in locations:
            for building_type in building_types:
                groups[(county, district, building_type)].append(record)
    points = []
    for (county, district, building_type), items in groups.items():
        units = [item["unit_price_ping"] for item in items]
        totals = [item["total_price"] for item in items]
        points.append({"season":season, "label":label(season), "county":county, "district":district, "building_type":building_type,
                       "count":len(items), "median_unit_price":round(statistics.median(units), 2), "median_total_price":round(statistics.median(totals), 2),
                       "min_unit_price":min(units), "max_unit_price":max(units)})
    return points

def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temporary.replace(path)

def read_existing(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {"points":[], "seasons":[]}

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "public/data/real-price-history.json")
    parser.add_argument("--seasons", help="Comma-separated ROC seasons, e.g. 114S1,114S2")
    parser.add_argument("--season-zip", action="append", default=[], help="SEASON=path for a saved official archive")
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    requested = args.seasons.split(",") if args.seasons else seasons_through_previous_quarter(datetime.now(timezone.utc))
    local_archives = {item.split("=", 1)[0]: Path(item.split("=", 1)[1]) for item in args.season_zip}
    existing = read_existing(args.output)
    completed = set() if args.refresh else set(existing.get("seasons", []))
    points = [] if args.refresh else [point for point in existing.get("points", []) if point.get("season") in completed]
    failures: dict[str, str] = {}
    for season in requested:
        if season in completed:
            continue
        try:
            data = local_archives[season].read_bytes() if season in local_archives else download_season(season)
            raw, _ = read_zip(data)
            records = [RealPriceRecord.model_validate(item).model_dump(mode="json") for row in raw if (item := normalize(row)) is not None]
            if not records:
                raise ValueError("archive returned zero valid sale records")
            points.extend(aggregate(season, records))
            completed.add(season)
            print(json.dumps({"season":season, "records":len(records), "points":len(points)}, ensure_ascii=False), flush=True)
        except Exception as error:
            failures[season] = f"{type(error).__name__}: {error}"[:300]
    if not completed:
        raise RuntimeError(f"no historical season available: {failures}")
    points.sort(key=lambda item: (item["season"], item["county"], item["district"], item["building_type"]))
    payload = {"schema_version":"1.0.0", "generated_at":datetime.now(timezone.utc).isoformat(), "source_name":"內政部非本期實價批次資料",
               "source_url":"https://data.gov.tw/dataset/18703", "license":"政府資料開放授權條款-第1版", "basis":"官方發布季度",
               "seasons":sorted(completed), "failures":failures, "points":points}
    atomic_json(args.output, payload)
    print(json.dumps({"seasons":sorted(completed), "points":len(points), "failures":failures, "output":str(args.output)}, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
