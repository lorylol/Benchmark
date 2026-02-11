import argparse
import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple

import requests
from bs4 import BeautifulSoup

CPU_URL = "https://cpu.userbenchmark.com/"
GPU_URL = "https://gpu.userbenchmark.com/"

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def fetch_html(url: str) -> str:
  response = requests.get(url, timeout=30)
  response.raise_for_status()
  return response.text


def read_local_html(path: Path) -> str:
  return path.read_text(encoding="utf-8", errors="ignore")


def parse_number(text: str) -> Optional[float]:
  match = re.search(r"([0-9]+(?:[\.,][0-9]+)?)", text or "")
  if not match:
    return None
  raw = match.group(1).replace(",", "")
  try:
    return float(raw)
  except ValueError:
    return None


def normalize_space(value: str) -> str:
  return re.sub(r"\s+", " ", value or "").strip()


def extract_vendor_and_model(cell) -> Tuple[str, str, str]:
  link = cell.find("a")
  model = normalize_space(link.get_text(" ", strip=True)) if link else ""
  text = normalize_space(cell.get_text(" ", strip=True))
  vendor_match = re.search(r"\b(amd|intel|nvidia)\b", text, re.IGNORECASE)
  vendor_raw = vendor_match.group(1).lower() if vendor_match else ""
  vendor_map = {"amd": "AMD", "intel": "Intel", "nvidia": "Nvidia"}
  vendor = vendor_map.get(vendor_raw, "")
  name = normalize_space(f"{vendor} {model}" if vendor and model else text)
  vendor_label = vendor
  return name, vendor_label, model


def find_benchmark_table(soup: BeautifulSoup):
  candidates = []
  for table in soup.select("table"):
    ths = table.select("thead th")
    headers = [th.get("data-mhth") for th in ths if th.get("data-mhth")]
    if "MC_BENCH" in headers and "MC_VALUE" in headers:
      rows = table.select("tbody tr")
      candidates.append((len(rows), table))
  if not candidates:
    return None
  candidates.sort(key=lambda item: item[0], reverse=True)
  return candidates[0][1]


def parse_table_items(html: str, allowed_vendors: Optional[List[str]] = None) -> List[Dict]:
  soup = BeautifulSoup(html, "html.parser")
  table = find_benchmark_table(soup)
  if not table:
    return []

  ths = table.select("thead th")
  header_positions = {}
  for idx, th in enumerate(ths):
    key = th.get("data-mhth")
    if key:
      header_positions[key] = idx

  value_idx = header_positions.get("MC_VALUE")
  bench_idx = header_positions.get("MC_BENCH")
  if value_idx is None or bench_idx is None:
    return []

  allowed = {vendor.lower() for vendor in (allowed_vendors or [])}
  items: List[Dict] = []
  rows = table.select("tbody tr.hovertarget") or table.select("tbody tr")
  for row in rows:
    tds = row.find_all("td")
    if len(tds) <= max(value_idx, bench_idx, 1):
      continue

    rank = parse_number(tds[0].get_text(" ", strip=True))
    name_cell = tds[1]
    name, vendor_label, _ = extract_vendor_and_model(name_cell)
    if not name:
      continue
    if allowed and vendor_label.lower() not in allowed:
      continue

    value = parse_number(tds[value_idx].get_text(" ", strip=True)) or 0.0
    score = parse_number(tds[bench_idx].get_text(" ", strip=True)) or 0.0

    items.append({
      "name": name,
      "score": score,
      "value": value,
      "rank": int(rank) if rank else None,
      "source": None,
    })

  return items


def normalize_name(value: str) -> str:
  return normalize_space(value).lower()


def dedupe_items(items: List[Dict]) -> List[Dict]:
  seen = {}
  for item in items:
    key = normalize_name(item.get("name", ""))
    if not key:
      continue
    if key not in seen:
      seen[key] = item
      continue
    existing = seen[key]
    seen[key] = {
      **existing,
      **item,
      "score": item.get("score") or existing.get("score"),
      "value": item.get("value") or existing.get("value"),
      "rank": item.get("rank") or existing.get("rank"),
      "source": item.get("source") or existing.get("source"),
    }
  return list(seen.values())


def rerank_by_score(items: List[Dict]) -> List[Dict]:
  ranked = sorted(items, key=lambda x: x.get("score", 0), reverse=True)
  for idx, item in enumerate(ranked, start=1):
    item["rank"] = idx
  return ranked


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


def filter_intel_2010_plus(items: List[Dict]) -> List[Dict]:
  filtered: List[Dict] = []
  for item in items:
    name = item.get("name", "")
    if normalize_name(name).startswith("intel"):
      if is_intel_2010_plus(name):
        filtered.append(item)
      continue
    filtered.append(item)
  return filtered


def detect_captcha(html: str) -> bool:
  return "Please click the green human" in html or "page/captcha" in html


def load_html(source_path: Optional[Path], url: str) -> str:
  if source_path:
    return read_local_html(source_path)
  return fetch_html(url)


def build_ranked(items: List[Dict]) -> List[Dict]:
  ranked = sorted(items, key=lambda x: (x.get("rank") or 0, -(x.get("score") or 0)))
  fallback_sorted = sorted(ranked, key=lambda x: x.get("score", 0), reverse=True)
  for idx, item in enumerate(fallback_sorted, start=1):
    item["rank"] = item.get("rank") or idx
  return fallback_sorted


def main() -> int:
  parser = argparse.ArgumentParser(description="Scarica e prepara benchmark da UserBenchmark.")
  parser.add_argument("--cpu-html", type=Path, help="Percorso HTML salvato per CPU.")
  parser.add_argument("--gpu-html", type=Path, help="Percorso HTML salvato per GPU.")
  args = parser.parse_args()

  try:
    cpu_html = load_html(args.cpu_html, CPU_URL)
    gpu_html = load_html(args.gpu_html, GPU_URL)
  except (requests.RequestException, OSError) as exc:
    print(f"Errore nel download o lettura file: {exc}")
    return 1

  if detect_captcha(cpu_html) or detect_captcha(gpu_html):
    print("UserBenchmark ha bloccato la richiesta con captcha.")
    print("Apri i siti nel browser, completa il captcha e salva la pagina HTML.")
    print("Poi esegui: python scripts/fetch_userbenchmark.py --cpu-html <file> --gpu-html <file>")
    return 1

  cpus = build_ranked(dedupe_items(parse_table_items(cpu_html, ["Intel", "AMD"])))
  cpus = rerank_by_score(filter_intel_2010_plus(cpus))
  gpus = build_ranked(dedupe_items(parse_table_items(gpu_html, ["Nvidia", "AMD", "Intel"])))

  if not cpus or not gpus:
    print("Nessun dato trovato. Verifica che le pagine salvate contengano la tabella benchmark.")
    return 1

  for item in cpus:
    item["source"] = CPU_URL
  for item in gpus:
    item["source"] = GPU_URL

  cpus_json = json.dumps(cpus, separators=(",", ":"))
  gpus_json = json.dumps(gpus, separators=(",", ":"))
  (OUTPUT_DIR / "cpus.json").write_text(cpus_json)
  (OUTPUT_DIR / "gpus.json").write_text(gpus_json)
  (OUTPUT_DIR / "cpus.js").write_text(f"window.__CPU_DATA__ = {cpus_json};")
  (OUTPUT_DIR / "gpus.js").write_text(f"window.__GPU_DATA__ = {gpus_json};")

  print(f"CPU: {len(cpus)} voci, GPU: {len(gpus)} voci.")
  print("pairs.json non viene generato: serve una fonte specifica.")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
