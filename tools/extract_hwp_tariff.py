import json
import re
import struct
import zlib
from pathlib import Path

import olefile


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "관세율표.hwp"
OUTPUT = ROOT / "hs-tariff-data.js"


def extract_hwp_text(path: Path) -> str:
    ole = olefile.OleFileIO(str(path))
    header = ole.openstream("FileHeader").read()
    compressed = bool(struct.unpack("<I", header[36:40])[0] & 1)
    texts = []

    for stream in ole.listdir(streams=True):
        if len(stream) != 2 or stream[0] != "BodyText" or not stream[1].startswith("Section"):
            continue

        data = ole.openstream("/".join(stream)).read()
        if compressed:
            data = zlib.decompress(data, -15)

        pos = 0
        while pos + 4 <= len(data):
            record_header = struct.unpack("<I", data[pos : pos + 4])[0]
            pos += 4
            tag = record_header & 0x3FF
            size = (record_header >> 20) & 0xFFF
            if size == 0xFFF:
                size = struct.unpack("<I", data[pos : pos + 4])[0]
                pos += 4

            payload = data[pos : pos + size]
            pos += size

            # HWPTAG_PARA_TEXT
            if tag == 67:
                texts.append(payload.decode("utf-16le", errors="ignore"))

    return "\n".join(texts)


def clean_line(line: str) -> str:
    line = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", line)
    return line.strip()


def pad10(code: str) -> str:
    return re.sub(r"\D", "", code)[:10].ljust(10, "0")


def build_entries(text: str) -> list[dict[str, str]]:
    lines = [clean_line(line) for line in text.splitlines()]
    lines = [line for line in lines if line]
    skip = {"번 호", "품 명", "세율(%)", "호", "소호", "주:", "무세"}

    def is_noise(value: str) -> bool:
        return (
            value in skip
            or bool(re.fullmatch(r"\d+\.", value))
            or bool(re.fullmatch(r"\d+(\.\d+)?", value))
        )

    def next_term(index: int) -> str:
        for next_index in range(index + 1, min(index + 10, len(lines))):
            value = lines[next_index].strip()
            if re.fullmatch(r"\d{1,4}", value) or is_noise(value):
                continue
            return value[:360]
        return ""

    entries = []
    current4 = None
    for index, line in enumerate(lines):
        if re.fullmatch(r"\d{4}", line):
            current4 = line
            entries.append(
                {
                    "code": pad10(line),
                    "rawCode": line,
                    "term": next_term(index),
                    "source": SOURCE.name,
                }
            )
        elif current4 and re.fullmatch(r"\d{2}", line):
            raw_code = current4 + line
            entries.append(
                {
                    "code": pad10(raw_code),
                    "rawCode": raw_code,
                    "term": next_term(index),
                    "source": SOURCE.name,
                }
            )

    deduped = {}
    for entry in entries:
        if not entry["term"]:
            continue
        if entry["code"] not in deduped or len(entry["term"]) > len(deduped[entry["code"]]["term"]):
            deduped[entry["code"]] = entry

    return [deduped[key] for key in sorted(deduped)]


def main() -> None:
    text = extract_hwp_text(SOURCE)
    rows = build_entries(text)
    OUTPUT.write_text(
        "// Generated from 관세율표.hwp. Codes are normalized to 10 digits by right-padding zeros.\n"
        "// Extraction note: HWP table text is hierarchical; rawCode preserves the number as printed in the source.\n"
        f"window.HS_TARIFF_DATA = {json.dumps(rows, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )
    print(f"written {len(rows)} entries")


if __name__ == "__main__":
    main()
