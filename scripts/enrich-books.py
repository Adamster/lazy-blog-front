"""Fill new catalogue cards from verified LiveLib work pages.

Run with --limit N for a small batch. Ambiguous matches are left untouched and
reported so a human can verify them; the script never invents rating data.
"""

from __future__ import annotations

import argparse
import concurrent.futures
from difflib import SequenceMatcher
import html
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public/books"
CATALOGUE = ROOT / "books.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; LazyBlogBooks/1.0)"}
NEXT_DATA = re.compile(r'<script>self\.__next_f\.push\((.*?)\)</script>', re.S)
SEARCH_RESULT = re.compile(r'"type":"art_(?:works|editions)","instance":')
TITLE_ALIASES = {
    "чувствоичувствительность": "Разум и чувства",
    "отельупогибшегоальпиниста": "Дело об убийстве, или Отель «У погибшего альпиниста»",
    "ночьнежна": "Как ночь нежна",
    "песньдлялейбовица": "Гимн Лейбовицу",
    "дворшиповироз": "Королевство шипов и роз",
    "скотныйдвор": "Скотный двор",
    "обездоленные": "Обделенные",
    "подвулканом": "У подножия вулкана",
    "тамгдеракипоют": "Там, где раки поют",
    "гдепоютраки": "Там, где раки поют",
    "бойняномерпятьиликрестовыйпоходдетей": "Бойня № 5",
}


def norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.lower().replace("ё", "е"))
    return "".join(char for char in value if char.isalnum())


def fetch(url: str) -> bytes:
    last = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=18) as response:
                return response.read()
        except Exception as error:
            last = error
            time.sleep(0.8 * (attempt + 1))
    raise last


def search(book: dict) -> str:
    title, author = book["title"], book["author"]
    lookup_title = TITLE_ALIASES.get(norm(title), title)
    surnames = [norm(part.split()[-1]) for part in author.split(",") if part.strip()]
    for query_text in (f"{lookup_title} {author}", lookup_title):
        query = urllib.parse.quote(query_text)
        markup = fetch(f"https://www.livelib.ru/search?q={query}").decode("utf-8")
        candidates = []
        for script in NEXT_DATA.findall(markup):
            try:
                payload = json.loads(script)[1]
            except (json.JSONDecodeError, IndexError, TypeError):
                continue
            if not isinstance(payload, str):
                continue
            for match in SEARCH_RESULT.finditer(payload):
                try:
                    candidate, _ = json.JSONDecoder().raw_decode(payload, match.end())
                except json.JSONDecodeError:
                    continue
                candidate_title = html.unescape(candidate.get("title", ""))
                candidate_author = ", ".join(person.get("full_name", "") for person in (candidate.get("authors") or []))
                url = candidate.get("url", "")
                if not url.startswith(("/work/", "/book/")):
                    continue
                title_score = SequenceMatcher(None, norm(lookup_title), norm(candidate_title)).ratio()
                title_match = norm(lookup_title) == norm(candidate_title)
                author_match = bool(surnames) and all(surname in norm(candidate_author) for surname in surnames)
                if author_match and (title_match or title_score >= 0.91):
                    candidates.append((int(title_match), (candidate.get("stats") or {}).get("marks_count") or 0,
                                       title_score, "https://www.livelib.ru" + url))
        if candidates:
            candidates.sort(reverse=True)
            return candidates[0][3]
        # Some LiveLib records omit patronymics/initials or normalize translated authors.
        # For an exact normalized title, accept the highest-marked work only.
        loose = []
        for script in NEXT_DATA.findall(markup):
            try: payload = json.loads(script)[1]
            except (json.JSONDecodeError, IndexError, TypeError): continue
            if not isinstance(payload, str): continue
            for match in SEARCH_RESULT.finditer(payload):
                try: candidate, _ = json.JSONDecoder().raw_decode(payload, match.end())
                except json.JSONDecodeError: continue
                ct = html.unescape(candidate.get("title", "")); url = candidate.get("url", "")
                if url.startswith(("/work/", "/book/")) and norm(lookup_title) == norm(ct):
                    loose.append(((candidate.get("stats") or {}).get("marks_count") or 0, "https://www.livelib.ru" + url))
        if loose:
            loose.sort(reverse=True); return loose[0][1]
    raise ValueError("no confident title and author match")


def details(url: str) -> tuple[float, int, int]:
    markup = fetch(url).decode("utf-8")
    # The page's work stats retain the score precision hidden by the UI's
    # one-decimal display. LiveLib uses a ten-point internal score.
    stats = re.search(r'\\"stats\\":\{\\"rating\\":\\"([\d.]+)\\",\\"marks_count\\":(\d+)', markup)
    read = re.search(r'Прочитали\s+(\d+)', markup)
    if not stats or not read:
        raise ValueError("rating or read count absent on work page")
    return float(stats[1]) / 2, int(stats[2]), int(read[1])


def enrich(book: dict) -> tuple[dict, str | None]:
    try:
        url = search(book)
        score, ratings, reads = details(url)
        return {"liveLibScore": score, "liveLibRatingCount": ratings,
                "liveLibReadCount": reads, "liveLibLink": url}, None
    except Exception as error:
        return {}, f"{book['author']} — {book['title']}: {error}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--workers", type=int, default=5)
    args = parser.parse_args()
    catalogue = json.loads(CATALOGUE.read_text())
    targets = []
    for category in catalogue:
        for book in category["books"]:
            # Recheck every card: older imports can contain a link but miss one
            # of the numeric fields, or contain a stale/partial record.
            needs = any(book.get(field) in (None, "") for field in
                        ("liveLibScore", "liveLibRatingCount", "liveLibReadCount", "liveLibLink"))
            if needs and not book.get("seriesBooks"):
                targets.append(book)
            for part in book.get("seriesBooks") or []:
                if isinstance(part, dict) and any(part.get(field) in (None, "") for field in
                        ("liveLibScore", "liveLibRatingCount", "liveLibReadCount", "liveLibLink")):
                    targets.append(part)
    if args.limit:
        targets = targets[:args.limit]
    print(f"Checking {len(targets)} new cards", flush=True)
    done, errors = 0, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(enrich, book): book for book in targets}
        for future in concurrent.futures.as_completed(futures):
            book = futures[future]
            fields, error = future.result()
            if error:
                errors.append(error)
                print("!", error, flush=True)
                continue
            book.update(fields)
            done += 1
            if done % 10 == 0:
                CATALOGUE.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
                print(f"Updated {done}/{len(targets)}", flush=True)
    # The top-level series card displays the first volume's cover and rating.
    for category in catalogue:
        for book in category["books"]:
            parts = book.get("seriesBooks") or []
            if book["id"].startswith("catalog-") and parts and isinstance(parts[0], dict):
                first = parts[0]
                if first.get("liveLibLink"):
                    for field in ("liveLibScore", "liveLibRatingCount", "liveLibReadCount", "liveLibLink"):
                        book[field] = first[field]
    CATALOGUE.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
    print(f"Updated {done}; unresolved {len(errors)}", flush=True)
    (ROOT / "enrichment-unresolved.txt").write_text("\n".join(errors) + ("\n" if errors else ""))


if __name__ == "__main__":
    main()
