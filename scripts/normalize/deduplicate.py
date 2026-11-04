from __future__ import annotations
import hashlib
import re
import unicodedata
from collections import defaultdict

def canonical_address(value: object) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).replace("台", "臺")
    return re.sub(r"[\s,，.。:：;；()（）/\\_土地：－-]", "", text).lower()

def _number(record: dict, *keys: str) -> float | None:
    for key in keys:
        value = record.get(key)
        if value is not None:
            try: return float(value)
            except (TypeError, ValueError): pass
    return None

def _close(left: float | None, right: float | None, tolerance: float) -> bool:
    if left is None or right is None: return False
    scale = max(abs(left), abs(right), 1)
    return abs(left - right) / scale <= tolerance

def mark_duplicate_candidates(records: list[dict]) -> list[dict]:
    """Flag conservative candidates without merging or deleting source rows."""
    blocks: dict[str, list[int]] = defaultdict(list)
    for index, record in enumerate(records):
        record["duplicate_group_id"] = None
        record["duplicate_confidence"] = None
        record["duplicate_match_basis"] = []
        address = canonical_address(record.get("address"))
        if address: blocks[address].append(index)

    parent = list(range(len(records)))
    confidence: dict[int, float] = {}
    reasons: dict[int, set[str]] = defaultdict(set)

    def find(value: int) -> int:
        while parent[value] != value:
            parent[value] = parent[parent[value]]
            value = parent[value]
        return value

    def union(left: int, right: int, score: float, basis: set[str]) -> None:
        root_left, root_right = find(left), find(right)
        if root_left != root_right: parent[root_right] = root_left
        confidence[left] = max(confidence.get(left, 0), score)
        confidence[right] = max(confidence.get(right, 0), score)
        reasons[left].update(basis); reasons[right].update(basis)

    for indices in blocks.values():
        for position, left_index in enumerate(indices):
            left = records[left_index]
            left_area = _number(left, "building_area_ping", "land_area_ping")
            left_price = _number(left, "reserve_price", "final_price", "total_price")
            for right_index in indices[position + 1:]:
                right = records[right_index]
                right_area = _number(right, "building_area_ping", "land_area_ping")
                right_price = _number(right, "reserve_price", "final_price", "total_price")
                area_close, price_close = _close(left_area, right_area, .01), _close(left_price, right_price, .03)
                exact_values = left_area == right_area and left_price == right_price
                if exact_values and left["source_id"] == right["source_id"]:
                    union(left_index, right_index, 1.0, {"同來源重複列", "標準化地址相同", "面積與價格相同"})
                elif area_close and price_close:
                    score = .94 if left["source_id"] != right["source_id"] else .9
                    union(left_index, right_index, score, {"標準化地址相同", "面積差異不超過1%", "價格差異不超過3%"})

    grouped: dict[int, list[int]] = defaultdict(list)
    for index in confidence: grouped[find(index)].append(index)
    for indices in grouped.values():
        seed = "|".join(sorted(records[index]["id"] for index in indices))
        group_id = "dup-" + hashlib.sha256(seed.encode()).hexdigest()[:12]
        group_score = max(confidence[index] for index in indices)
        group_reasons = sorted(set().union(*(reasons[index] for index in indices)))
        for index in indices:
            records[index]["duplicate_group_id"] = group_id
            records[index]["duplicate_confidence"] = round(group_score, 2)
            records[index]["duplicate_match_basis"] = group_reasons
    return records

def ensure_unique_ids(records: list[dict]) -> list[dict]:
    """Preserve repeated official rows while making their IDs addressable."""
    totals, seen = defaultdict(int), defaultdict(int)
    for record in records: totals[record["id"]] += 1
    for record in records:
        original = record["id"]
        if totals[original] > 1:
            seen[original] += 1
            record["id"] = f"{original}-{seen[original]}"
            record["duplicate_group_id"] = record.get("duplicate_group_id") or f"dup-{original.split('-', 1)[-1][:12]}"
            record["duplicate_confidence"] = record.get("duplicate_confidence") or 1.0
            record["duplicate_match_basis"] = record.get("duplicate_match_basis") or ["來源內完全相同的穩定識別鍵"]
    return records
