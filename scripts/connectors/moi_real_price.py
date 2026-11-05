from __future__ import annotations
import csv
import io
import urllib.request
import zipfile
from pathlib import Path
from scripts.connectors.https import verified_context

URL = "https://plvr.land.moi.gov.tw/opendata/lvr_landAcsv.zip"
SEASON_URL = "https://plvr.land.moi.gov.tw/DownloadSeason?fileName=lvr_landcsv.zip&season={season}&type=zip"

def download() -> bytes:
    request = urllib.request.Request(URL, headers={"User-Agent": "TaiwanRealEstateAggregator/1.0 (official-open-data)"})
    with urllib.request.urlopen(request, timeout=90, context=verified_context()) as response:
        return response.read()

def download_season(season: str) -> bytes:
    if len(season) != 5 or not season[:3].isdigit() or season[3] != "S" or season[4] not in "1234":
        raise ValueError(f"invalid season: {season}")
    request = urllib.request.Request(SEASON_URL.format(season=season), headers={"User-Agent": "TaiwanRealEstateAggregator/1.0 (official-open-data)"})
    with urllib.request.urlopen(request, timeout=120, context=verified_context()) as response:
        return response.read()

def read_zip(data: bytes) -> tuple[list[dict[str, str]], str | None]:
    rows: list[dict[str, str]] = []
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        manifest = list(csv.DictReader(io.StringIO(archive.read("manifest.csv").decode("utf-8-sig"))))
        county_by_file = {row["name"]: row["description"].removesuffix("不動產買賣") for row in manifest if row.get("schema") == "schema-main.csv" and row.get("name", "").endswith("_lvr_land_a.csv")}
        for filename, county in county_by_file.items():
            reader = csv.DictReader(io.StringIO(archive.read(filename).decode("utf-8-sig")))
            next(reader, None)  # The second physical row contains English field labels.
            rows.extend({**row, "縣市": county} for row in reader)
        period = archive.read("build_time.xml").decode("utf-8-sig")
    start, end = period.find("<lvr_time>"), period.find("</lvr_time>")
    return rows, period[start + 10:end].strip() if start >= 0 and end > start else None

def fetch(input_zip: Path | None = None) -> tuple[list[dict[str, str]], str | None]:
    return read_zip(input_zip.read_bytes() if input_zip else download())
