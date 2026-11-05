from __future__ import annotations
import argparse
import io
import json
import math
import sys
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
import shapefile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.connectors.https import verified_context

SOURCE_URL = "https://maps.nlsc.gov.tw/download/鄉鎮市區界線(TWD97經緯度).zip"
DATASET_URL = "https://data.gov.tw/dataset/7441"

def download() -> bytes:
    encoded = urllib.parse.quote(SOURCE_URL, safe=":/().")
    request = urllib.request.Request(encoded, headers={"User-Agent":"TaiwanRealEstateAggregator/1.0 (official-open-data)"})
    with urllib.request.urlopen(request, timeout=120, context=verified_context()) as response:
        return response.read()

def polygon_centroid(points: list[list[float]], parts: list[int], bbox: list[float]) -> tuple[float, float]:
    starts = [*parts, len(points)]
    area2_total = x_total = y_total = 0.0
    for start, end in zip(starts, starts[1:]):
        ring = points[start:end]
        if len(ring) < 3:
            continue
        area2 = x_sum = y_sum = 0.0
        for index, (x1, y1) in enumerate(ring):
            x2, y2 = ring[(index + 1) % len(ring)]
            cross = x1 * y2 - x2 * y1
            area2 += cross
            x_sum += (x1 + x2) * cross
            y_sum += (y1 + y2) * cross
        area2_total += area2
        x_total += x_sum
        y_total += y_sum
    if abs(area2_total) < 1e-12:
        return (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    longitude, latitude = x_total / (3 * area2_total), y_total / (3 * area2_total)
    if not (math.isfinite(longitude) and math.isfinite(latitude) and 114 <= longitude <= 125 and 10 <= latitude <= 27):
        raise ValueError(f"invalid administrative centroid: {longitude}, {latitude}")
    return longitude, latitude

def extract(data: bytes) -> list[dict]:
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        shp_names = [name for name in names if name.lower().endswith(".shp")]
        if not shp_names:
            raise ValueError("official archive does not contain a shapefile")
        # The official archive may contain a one-record correction layer in
        # addition to the nationwide TOWN layer. The nationwide layer is the
        # largest SHP and is the only suitable source for a complete lookup.
        shp_name = max(shp_names, key=lambda name: archive.getinfo(name).file_size)
        stem = shp_name[:-4]
        reader = shapefile.Reader(shp=io.BytesIO(archive.read(shp_name)), shx=io.BytesIO(archive.read(stem + ".shx")), dbf=io.BytesIO(archive.read(stem + ".dbf")), encoding="utf-8")
        fields = [field[0] for field in reader.fields[1:]]
        records = []
        for shape_record in reader.iterShapeRecords():
            attributes = dict(zip(fields, shape_record.record))
            longitude, latitude = polygon_centroid(shape_record.shape.points, list(shape_record.shape.parts), list(shape_record.shape.bbox))
            records.append({"source_id":"nlsc-town-boundaries", "town_code":str(attributes.get("TOWNCODE") or attributes.get("TOWNID") or "").strip(),
                            "county":str(attributes.get("COUNTYNAME") or "").strip(), "district":str(attributes.get("TOWNNAME") or "").strip(),
                            "latitude":round(latitude, 6), "longitude":round(longitude, 6), "location_precision":"district"})
    valid = [record for record in records if record["county"] and record["district"]]
    if len(valid) < 350:
        raise ValueError(f"expected at least 350 administrative districts, got {len(valid)}")
    return valid

def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temporary.replace(path)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-zip", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "public/data/admin-centroids.json")
    args = parser.parse_args()
    records = extract(args.input_zip.read_bytes() if args.input_zip else download())
    payload = {"schema_version":"1.0.0", "generated_at":datetime.now(timezone.utc).isoformat(), "source_name":"內政部國土測繪中心鄉鎮市區界線",
               "source_url":DATASET_URL, "license":"政府資料開放授權條款-第1版", "coordinate_reference":"TWD97 geographic (treated as WGS84-compatible for district-level display)",
               "precision":"district", "records":records}
    atomic_json(args.output, payload)
    print(json.dumps({"records":len(records), "counties":len({record["county"] for record in records}), "output":str(args.output)}, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
