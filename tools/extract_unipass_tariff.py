"""Fetch Korea 2026 HS tariff codes from UNIPASS CLIP.

The CLIP site renders the official tariff table as HTML. This script follows
the same POST endpoints used by the page:

1. openULS0201004Q.do: chapter -> 4-digit heading list
2. openULS0201005Q.do: heading -> 10-digit tariff line list

It writes hs-tariff-data.js for the static app.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


BASE_URL = "https://unipass.customs.go.kr/clip/hsinfosrch"
COMMON_FORM = {
    "cntyCd": "KR",
    "aplyYy": "2026",
    "cntyNm": "Republic of Korea",
    "sctYear": "20260101",
    "hstdYear": "20260101",
    "engl": "Y",
}
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "hs-tariff-data.js"


def post_html(path: str, search_value: str) -> str:
    data = {**COMMON_FORM, "searchVal": search_value}
    body = urllib.parse.urlencode(data).encode("utf-8")
    request = urllib.request.Request(
        f"{BASE_URL}/{path}",
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 HS-Code-Prototype",
        },
    )
    last_error: Exception | None = None
    for attempt in range(1, 6):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", "replace")
        except (TimeoutError, urllib.error.URLError, urllib.error.HTTPError) as exc:
            last_error = exc
            wait_seconds = attempt * 2
            print(f"Retry {attempt}/5 for {search_value}: {exc}. waiting {wait_seconds}s")
            time.sleep(wait_seconds)
    raise RuntimeError(f"Failed to fetch {search_value}") from last_error


def clean_cell(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value.replace("\u3000", "").strip()


def extract_headings(page: str) -> dict[str, dict[str, str]]:
    headings: dict[str, dict[str, str]] = {}
    for row in re.findall(r"<tr>(.*?)</tr>", page, flags=re.S):
        match = re.search(r'name="hsfdCd_Mn" value="(\d{4})"', row)
        if not match:
            continue
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)
        values = [clean_cell(cell) for cell in cells]
        if len(values) >= 3:
            code = match.group(1)
            headings[code] = {
                "heading": code,
                "headingEnglish": values[1],
                "headingKorean": values[2],
            }
    return headings


def extract_tariff_lines(page: str, heading_meta: dict[str, str]) -> list[dict[str, str]]:
    lines: list[dict[str, str]] = []
    for row in re.findall(r"<tr>(.*?)</tr>", page, flags=re.S):
        match = re.search(r'name="hsSgn_Mn" value="(\d{10})"', row)
        if not match:
            continue
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)
        values = [clean_cell(cell) for cell in cells]
        if len(values) < 6:
            continue
        code = match.group(1)
        heading = values[0]
        subheading = values[1]
        item = values[2]
        english = values[3]
        korean = values[4]
        base_rate = values[5]
        lines.append(
            {
                "code": code,
                "rawCode": f"{heading}{subheading}{item}",
                "term": korean,
                "english": english,
                "heading": heading,
                "headingEnglish": heading_meta.get("headingEnglish", ""),
                "headingKorean": heading_meta.get("headingKorean", ""),
                "baseRate": base_rate,
                "source": "UNIPASS CLIP 2026",
            }
        )
    return lines


def main() -> None:
    all_headings: dict[str, dict[str, str]] = {}
    for number in range(1, 98):
        chapter = f"{number:02d}"
        page = post_html("openULS0201004Q.do", chapter)
        all_headings.update(extract_headings(page))
        time.sleep(0.05)

    records: dict[str, dict[str, str]] = {}
    for index, heading in enumerate(sorted(all_headings), start=1):
        page = post_html("openULS0201005Q.do", heading)
        for line in extract_tariff_lines(page, all_headings[heading]):
            records[line["code"]] = line
        print(f"{index:04d}/{len(all_headings)} {heading} -> {len(records)} records")
        time.sleep(0.05)

    payload = json.dumps(
        [records[code] for code in sorted(records)],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    OUTPUT.write_text(
        "// Generated from UNIPASS CLIP 2026 Korea tariff table.\n"
        "// Source: https://unipass.customs.go.kr/clip/index.do\n"
        f"window.HS_TARIFF_DATA = {payload};\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(records)} official 10-digit HS records to {OUTPUT}")


if __name__ == "__main__":
    main()
