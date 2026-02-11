import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


DATA_FILES = ["cpus.json", "gpus.json", "pairs.json"]


def normalize_space(value: str) -> str:
  return re.sub(r"\s+", " ", value or "").strip()


def parse_number(value: Any) -> Optional[float]:
  if value is None:
    return None
  if isinstance(value, (int, float)):
    return float(value)
  text = str(value)
  match = re.search(r"([0-9]+(?:[\.,][0-9]+)?)", text)
  if not match:
    return None
  raw = match.group(1).replace(",", "")
  try:
    return float(raw)
  except ValueError:
    return None


def normalize_vendor_prefix(name: str) -> str:
  lower = name.lower()
  if lower.startswith("intel "):
    return "Intel " + name[6:]
  if lower.startswith("amd "):
    return "AMD " + name[4:]
  if lower.startswith("nvidia "):
    return "Nvidia " + name[7:]
  return name


def normalize_name(value: str) -> str:
  return normalize_space(value).lower()


def is_intel_2010_plus(name: str) -> bool:
  text = normalize_space(name).lower()

  if "core 2" in text:
    return False
  if any(keyword in text for keyword in ("pentium", "celeron", "atom")):
    return False

  if "xeon" in text:
    version_match = re.search(r"\bv(\d{1,2})\b", text)
    if version_match:
      return int(version_match.group(1)) >= 2
    if any(tier in text for tier in ("gold", "silver", "bronze", "platinum")):
      return True
    series_match = re.search(r"\b(e|w)-?(\d{4,5})\b", text)
    if series_match:
      return int(series_match.group(2)) >= 2000
    return False

  if "core ultra" in text:
    return True

  if re.search(r"\bcore\s+m[357]\b", text):
    return True

  if re.search(r"\bcore\s+[3579]\b", text):
    return True

  core_match = re.search(r"\bcore\s+i[3579][ -]?(\d{3,5})", text)
  if core_match:
    digits = core_match.group(1)
    value = int(digits)
    if len(digits) >= 4:
      return value >= 2000
    return value >= 500

  return False


def estimate_intel_year(name: str) -> Optional[int]:
  text = normalize_space(name).lower()
  if "core ultra" in text:
    return 2023

  core_match = re.search(r"\bcore\s+i[3579][ -]?(\d{4,5})", text)
  if core_match:
    digits = core_match.group(1)
    if len(digits) >= 5:
      gen = int(digits[:2])
    else:
      gen = int(digits[0])
    gen_year = {
      1: 2009,
      2: 2011,
      3: 2012,
      4: 2013,
      5: 2015,
      6: 2015,
      7: 2017,
      8: 2017,
      9: 2018,
      10: 2020,
      11: 2021,
      12: 2021,
      13: 2022,
      14: 2023,
      15: 2024,
    }
    return gen_year.get(gen)

  if "xeon" in text:
    version_match = re.search(r"\bv(\d{1,2})\b", text)
    if version_match:
      version = int(version_match.group(1))
      if version >= 4:
        return 2016 + (version - 4)
      return 2013 + version
    scalable_match = re.search(r"\b(gold|silver|bronze|platinum)\s+(\d{4})\b", text)
    if scalable_match:
      series = int(scalable_match.group(2))
      return 2019 if series >= 4000 else 2017

  return None


def estimate_amd_year(name: str) -> Optional[int]:
  text = normalize_space(name).lower()
  if "ryzen" in text:
    match = re.search(r"\bryzen\s+[3579]\s*(\d{4})", text)
    if match:
      gen = int(match.group(1)[0])
      gen_year = {
        1: 2017,
        2: 2018,
        3: 2019,
        4: 2020,
        5: 2020,
        6: 2022,
        7: 2022,
        8: 2024,
        9: 2024,
      }
      return gen_year.get(gen)
  if "threadripper" in text:
    match = re.search(r"\bthreadripper\s*(\d{4})", text)
    if match:
      gen = int(match.group(1)[0])
      gen_year = {
        1: 2017,
        2: 2018,
        3: 2019,
        4: 2022,
        5: 2023,
      }
      return gen_year.get(gen)
  return None


def estimate_cpu_year(name: str) -> Optional[int]:
  text = normalize_space(name).lower()
  if text.startswith("intel ") or "xeon" in text:
    return estimate_intel_year(name)
  if text.startswith("amd ") or "ryzen" in text or "threadripper" in text:
    return estimate_amd_year(name)
  return None


def dedupe_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  best: Dict[str, Dict[str, Any]] = {}
  for item in items:
    key = normalize_name(item.get("name", ""))
    if not key:
      continue
    if key not in best:
      best[key] = item
      continue
    current = best[key]
    candidate = item

    def score_tuple(entry: Dict[str, Any]) -> Tuple[float, float, float]:
      score = parse_number(entry.get("score")) or 0.0
      value = parse_number(entry.get("value")) or 0.0
      rank = parse_number(entry.get("rank")) or 999999.0
      return (score, value, -rank)

    if score_tuple(candidate) > score_tuple(current):
      best[key] = candidate

  return list(best.values())


def rerank_by_score(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  ranked = sorted(items, key=lambda x: parse_number(x.get("score")) or 0.0, reverse=True)
  for idx, item in enumerate(ranked, start=1):
    item["rank"] = idx
  return ranked


def clean_cpu_items(items: List[Dict[str, Any]], filter_intel_2010: bool, recent_year: Optional[int]) -> List[Dict[str, Any]]:
  cleaned: List[Dict[str, Any]] = []
  for item in items:
    name = normalize_space(str(item.get("name", "")))
    if not name:
      continue
    name = normalize_vendor_prefix(name)
    lower_name = normalize_name(name)
    score = parse_number(item.get("score"))
    value = parse_number(item.get("value"))
    if score is None and value is None:
      continue

    if filter_intel_2010 and lower_name.startswith("intel"):
      if not is_intel_2010_plus(name):
        continue

    if recent_year:
      year = estimate_cpu_year(name)
      if not year or year < recent_year:
        continue

    cleaned.append({
      "name": name,
      "score": score or 0,
      "value": value or 0,
      "rank": parse_number(item.get("rank")) or None,
      "source": item.get("source") or None,
    })
  return rerank_by_score(dedupe_items(cleaned))


def clean_gpu_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  cleaned: List[Dict[str, Any]] = []
  for item in items:
    name = normalize_space(str(item.get("name", "")))
    if not name:
      continue
    name = normalize_vendor_prefix(name)
    score = parse_number(item.get("score"))
    value = parse_number(item.get("value"))
    if score is None and value is None:
      continue

    cleaned.append({
      "name": name,
      "score": score or 0,
      "value": value or 0,
      "rank": parse_number(item.get("rank")) or None,
      "source": item.get("source") or None,
    })
  return rerank_by_score(dedupe_items(cleaned))


def clean_pairs(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  cleaned: List[Dict[str, Any]] = []
  for item in items:
    cpu = normalize_space(str(item.get("cpu", "")))
    gpu = normalize_space(str(item.get("gpu", "")))
    if not cpu or not gpu:
      continue
    score = parse_number(item.get("score"))
    value = parse_number(item.get("value"))
    rank = parse_number(item.get("rank"))
    cleaned.append({
      "cpu": cpu,
      "gpu": gpu,
      "score": score or 0,
      "value": value or 0,
      "rank": int(rank) if rank else None,
      "source": item.get("source") or None,
    })
  return rerank_by_score(dedupe_items(cleaned))


def load_json(path: Path) -> List[Dict[str, Any]]:
  if not path.exists():
    return []
  try:
    return json.loads(path.read_text(encoding="utf-8"))
  except json.JSONDecodeError:
    return []


def write_json(path: Path, data: List[Dict[str, Any]]) -> str:
  payload = json.dumps(data, separators=(",", ":"))
  path.write_text(payload, encoding="utf-8")
  return payload


def main() -> int:
  parser = argparse.ArgumentParser(description="Pulisce e normalizza i dati benchmark.")
  parser.add_argument("--data-dir", type=Path, default=Path(__file__).resolve().parents[1] / "data")
  parser.add_argument("--intel-2010", action="store_true", help="Filtra CPU Intel dal 2010 in poi.")
  parser.add_argument("--recent-year", type=int, default=None, help="Mantieni CPU recenti dal dato anno in poi.")
  parser.add_argument("--intel-core-only", action="store_true", help="Mantieni solo CPU Intel Core (Core i/Ultra/M).")
  parser.add_argument("--intel-core-series", action="store_true", help="Mantieni solo Intel Core i3/i5/i7/i9.")
  args = parser.parse_args()

  data_dir = args.data_dir
  cpus_path = data_dir / "cpus.json"
  gpus_path = data_dir / "gpus.json"
  pairs_path = data_dir / "pairs.json"

  cpus_raw = load_json(cpus_path)
  gpus_raw = load_json(gpus_path)
  pairs_raw = load_json(pairs_path)

  cpus = clean_cpu_items(cpus_raw, args.intel_2010, args.recent_year)
  if args.intel_core_only:
    cpus = [item for item in cpus if re.search(r"\bintel\s+core\s+(i[3579]|ultra|m)\b", item["name"], re.IGNORECASE)]
    cpus = rerank_by_score(cpus)
  if args.intel_core_series:
    cpus = [item for item in cpus if re.search(r"\bintel\s+core\s+i[3579]\b", item["name"], re.IGNORECASE)]
    cpus = rerank_by_score(cpus)
  gpus = clean_gpu_items(gpus_raw)
  pairs = clean_pairs(pairs_raw)

  cpus_json = write_json(cpus_path, cpus)
  gpus_json = write_json(gpus_path, gpus)
  write_json(pairs_path, pairs)

  (data_dir / "cpus.js").write_text(f"window.__CPU_DATA__ = {cpus_json};", encoding="utf-8")
  (data_dir / "gpus.js").write_text(f"window.__GPU_DATA__ = {gpus_json};", encoding="utf-8")

  print(f"CPU: {len(cpus_raw)} -> {len(cpus)}")
  print(f"GPU: {len(gpus_raw)} -> {len(gpus)}")
  print(f"Pairs: {len(pairs_raw)} -> {len(pairs)}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
