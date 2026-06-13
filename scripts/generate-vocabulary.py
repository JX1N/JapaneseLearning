"""
Generate vocabulary seed data by cross-referencing:
  - Tanos JLPT N5 word list (from Bluskyo/JLPT_Vocabulary): kanji + reading + JLPT level
  - JMdict dictionary entries (from AnchorI/jlpt-kanji-dictionary): meanings, POS

Output: src/data/vocabulary.ts (TypeScript seed data file)
"""

import json
import csv
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)

# Paths
N5_CSV = os.path.join(PROJECT_DIR, "temp_jlpt_data", "data", "vocab", "parsedData", "n5_vocab_cleaned.csv")
DICT_PARTS = [
    os.path.join(PROJECT_DIR, "temp_anchor_jlpt", "dictionary_part_1.json"),
    os.path.join(PROJECT_DIR, "temp_anchor_jlpt", "dictionary_part_2.json"),
    os.path.join(PROJECT_DIR, "temp_anchor_jlpt", "dictionary_part_3.json"),
    os.path.join(PROJECT_DIR, "temp_anchor_jlpt", "dictionary_part_4.json"),
]
OUTPUT = os.path.join(PROJECT_DIR, "src", "data", "vocabulary.ts")

def main():
    # --- Step 1: Read N5 word list ---
    n5_words = {}  # kanji -> set of readings
    with open(N5_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            kanji = row["Kanji"].strip()
            reading = row["Reading"].strip()
            if kanji:
                if kanji not in n5_words:
                    n5_words[kanji] = set()
                n5_words[kanji].add(reading)

    print(f"N5 words loaded: {len(n5_words)} unique forms, "
          f"{sum(len(v) for v in n5_words.values())} total (kanji+reading pairs)")

    # Build reverse index: reading -> set of kanji
    reading_to_kanji = {}
    for kanji, readings in n5_words.items():
        for reading in readings:
            if reading not in reading_to_kanji:
                reading_to_kanji[reading] = set()
            reading_to_kanji[reading].add(kanji)

    # --- Step 2: Build lookup sets ---
    n5_kanji_set = set(n5_words.keys())
    n5_reading_set = set(reading_to_kanji.keys())

    # --- Step 3: Stream through dictionary files ---
    matched_by_kanji = {}
    matched_by_reading = {}  # reading -> entries (for kana-only words)
    total_entries = 0

    for part_path in DICT_PARTS:
        print(f"Processing {os.path.basename(part_path)}...")
        with open(part_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for entry in data:
            total_entries += 1
            kanji = entry.get("kanji", "").strip()
            reading = entry.get("reading", "").strip()

            # Match by kanji
            if kanji in n5_kanji_set:
                n5_readings = n5_words[kanji]
                if reading in n5_readings or not reading:
                    if kanji not in matched_by_kanji:
                        matched_by_kanji[kanji] = []
                    matched_by_kanji[kanji].append(entry)

            # Match by reading (for kana-only words)
            if reading in n5_reading_set:
                if reading not in matched_by_reading:
                    matched_by_reading[reading] = []
                matched_by_reading[reading].append(entry)

    print(f"Total dictionary entries scanned: {total_entries:,}")
    print(f"Matched by kanji: {len(matched_by_kanji)} forms")
    print(f"Matched by reading: {len(matched_by_reading)} forms")

    # --- Step 4: Build vocabulary list ---
    vocabulary = []
    not_found = []

    for kanji in sorted(n5_words.keys()):
        entry = None

        # First try: match by kanji
        if kanji in matched_by_kanji and matched_by_kanji[kanji]:
            entries = matched_by_kanji[kanji]
            target_readings = n5_words[kanji]
            entries.sort(key=lambda e: score_entry(e, target_readings), reverse=True)
            entry = entries[0]

        # Second try: for kana-only words, match by reading
        if entry is None and kanji in n5_reading_set:
            reading = list(n5_words[kanji])[0]  # Take first reading
            if reading in matched_by_reading and matched_by_reading[reading]:
                entries = matched_by_reading[reading]
                # Prefer entry where kanji matches the form (kana-only)
                entries.sort(key=lambda e: (
                    1 if e.get("kanji", "") == kanji else 0,
                    score_entry(e, n5_words[kanji])
                ), reverse=True)
                entry = entries[0]

        if entry:
            glossary = entry.get("glossary_en", [])
            meanings = clean_meanings(glossary)
            pos_raw = entry.get("pos", "")
            pos_simple = simplify_pos(pos_raw)

            vocabulary.append({
                "term": kanji,
                "reading": entry.get("reading", list(n5_words[kanji])[0] if n5_words[kanji] else ""),
                "meaning": "; ".join(meanings[:3]) if meanings else "",
                "partOfSpeech": pos_simple,
                "tags": ["N5"],
            })
        else:
            not_found.append(kanji)

    print(f"\nVocabulary entries generated: {len(vocabulary)}")
    print(f"Words not found: {len(not_found)}")
    if not_found:
        print(f"  Missing: {', '.join(not_found[:30])}")

    # Add not-found entries with empty meaning
    for kanji in not_found:
        for reading in n5_words[kanji]:
            vocabulary.append({
                "term": kanji,
                "reading": reading,
                "meaning": "",
                "partOfSpeech": "不明",
                "tags": ["N5"],
            })

    # --- Step 5: Write TypeScript output ---
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("// Auto-generated vocabulary seed data\n")
        f.write(f"// Source: Tanos JLPT N5 list + JMdict (via AnchorI/jlpt-kanji-dictionary)\n")
        f.write(f"// Generated: {len(vocabulary)} N5 words ({len(not_found)} need manual review)\n")
        f.write("// DO NOT EDIT MANUALLY — re-run scripts/generate-vocabulary.py to regenerate\n\n")
        f.write("import type { WordRecord } from '../db/database'\n\n")
        f.write("type SeedWord = Omit<WordRecord, 'id' | 'createdAt' | 'updatedAt'>\n\n")
        f.write("export const BUILTIN_VOCABULARY: SeedWord[] = [\n")

        for v in vocabulary:
            term = v["term"].replace("'", "\\'").replace("\\", "\\\\")
            reading = v["reading"].replace("'", "\\'").replace("\\", "\\\\")
            meaning = v["meaning"].replace("\\", "\\\\").replace('"', '\\"')
            pos = v["partOfSpeech"].replace("'", "\\'").replace("\\", "\\\\")

            f.write(f"  {{ term: '{term}', reading: '{reading}', meaning: \"{meaning}\", "
                    f"partOfSpeech: '{pos}', tags: ['N5'], "
                    f"srsInterval: 0, srsEase: 2.5, srsDue: 0, srsReps: 0, srsLapses: 0 }},\n")

        f.write("]\n")

    print(f"\nOutput written to: {OUTPUT}")


def score_entry(entry, target_readings):
    """Score a dictionary entry for relevance. Higher = better match."""
    s = 0
    reading = entry.get("reading", "")
    if reading in target_readings:
        s += 1000
    seq = entry.get("sequence", 9999999)
    if isinstance(seq, (int, float)) and seq > 0:
        s -= seq / 10000  # Lower sequence = more common
    return s


def clean_meanings(glossary):
    """Extract clean English meanings, removing example sentences and cross-references."""
    meanings = []
    for g in glossary:
        g = str(g).strip()
        if not g:
            continue
        # Skip lines that are Japanese example sentences (contain kana/kanji)
        jap_chars = sum(1 for c in g[:10] if '぀' <= c <= 'ヿ' or '一' <= c <= '鿿')
        if jap_chars >= 2:
            continue

        # Remove "(See ...)" cross-references
        g = re.sub(r'\s*\(?[Ss]ee:?\s*[^)]*\)?\s*', '', g)
        g = re.sub(r'\s*[Ss]ee:?\s*\S+.*$', '', g)

        # Remove leading numbers like "1. "
        g = re.sub(r'^\d+\.\s*', '', g)

        # Remove trailing semicolons and whitespace
        g = g.strip('; ')

        if g and len(g) > 1:
            meanings.append(g)

    # Deduplicate while preserving order
    seen = set()
    result = []
    for m in meanings:
        if m.lower() not in seen:
            seen.add(m.lower())
            result.append(m)
    return result


def simplify_pos(pos_raw: str) -> str:
    """Convert JMdict POS abbreviations to human-readable labels."""
    if not pos_raw:
        return "不明"

    pos_map = {
        "n": "名詞",
        "v1": "一段動詞",
        "v5": "五段動詞",
        "vs": "する動詞",
        "vi": "自動詞",
        "vt": "他動詞",
        "vk": "一段動詞",  # kana variant of v1
        "vz": "一段動詞",
        "adj-i": "形容詞",
        "adj-ix": "形容詞",
        "adj-na": "な形容詞",
        "adj": "形容詞",
        "adj-no": "連体詞",
        "adv": "副詞",
        "adv-to": "副詞",
        "exp": "表現",
        "int": "感動詞",
        "prt": "助詞",
        "aux": "助動詞",
        "aux-v": "助動詞",
        "aux-adj": "助動詞",
        "conj": "接続詞",
        "ctr": "助数詞",
        "num": "数詞",
        "pn": "代名詞",
        "pref": "接頭語",
        "suf": "接尾語",
        "uk": "",    # "usually kana" — not a POS, filter out
        "hon": "敬語",
        "pol": "丁寧語",
        "hum": "謙譲語",
        "col": "口語",
        "sl": "俗語",
        "arch": "古語",
        "obs": "廃語",
        "on-mim": "擬音語",
        "on": "音読み",
        "kun": "訓読み",
        "io": "不規則",
        "ik": "不規則",
        "ok": "外字",
        "male": "男性語",
        "fem": "女性語",
        "sports": "スポーツ",
        "food": "食べ物",
        "geol": "地理",
        "math": "数学",
    }

    # Remove number suffixes (v1, v5, adj-i etc already handled)
    tokens = pos_raw.replace(",", " ").split()
    mapped = []
    for t in tokens:
        t = t.strip()
        # Try exact match first
        if t in pos_map:
            val = pos_map[t]
            if val:  # Skip empty values (like "uk")
                mapped.append(val)
        # Try stripping trailing numbers/sp chars
        else:
            base = re.sub(r'[\d]+$', '', t)
            if base in pos_map:
                val = pos_map[base]
                if val:
                    mapped.append(val)
            elif len(t) <= 4 and not any(c.isdigit() for c in t):
                mapped.append(t)

    if not mapped:
        return "その他"

    seen = set()
    result = []
    for m in mapped:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return "・".join(result[:3])


if __name__ == "__main__":
    main()
