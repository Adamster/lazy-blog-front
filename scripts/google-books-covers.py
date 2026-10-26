"""Fill remaining covers from Google Books metadata as a secondary fallback.

Publisher passes must run first. Results are accepted only when title and
author match closely and the downloaded image has useful dimensions.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import io
import json
import re
import unicodedata
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public/books"
BOOKS = ROOT / "books.json"
HEADERS = {"User-Agent": "Mozilla/5.0"}

def norm(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower().replace("ё", "е")
    return "".join(c for c in value if c.isalnum())

def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=18) as response:
        return response.read()

def search(book: dict):
    query = urllib.parse.quote(f"intitle:{book['title']} inauthor:{book['author']}")
    data = json.loads(fetch(f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=10").decode())
    title, author = norm(book["title"]), norm(book["author"])
    candidates = []
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        other_title = norm(info.get("title", ""))
        authors = " ".join(info.get("authors", []))
        other_author = norm(authors)
        similarity = SequenceMatcher(None, title, other_title).ratio()
        if not other_title or similarity < 0.82 or not any(part in other_author for part in re.findall(r"[a-zа-яё]{5,}", author)):
            continue
        links = info.get("imageLinks", {})
        url = links.get("extraLarge") or links.get("large") or links.get("medium") or links.get("thumbnail")
        if url:
            candidates.append((similarity, url.replace("http://", "https://").replace("&edge=curl", "")))
    if not candidates:
        return None
    for _, url in sorted(candidates, reverse=True):
        try:
            content = fetch(url)
            image = Image.open(io.BytesIO(content))
            if image.width < 300 or image.height < 450:
                continue
            name = hashlib.sha1(content).hexdigest()[:24] + ".jpg"
            return name, content
        except Exception:
            continue
    return None

def main():
    catalogue = json.loads(BOOKS.read_text())
    targets = []
    for category in catalogue:
        for book in category["books"]:
            if not book.get("cover") and not book.get("seriesBooks"):
                targets.append(book)
            for part in book.get("seriesBooks") or []:
                if isinstance(part, dict) and not part.get("cover"):
                    targets.append(part)
    found, errors = {}, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(search, book): book for book in targets}
        for future in concurrent.futures.as_completed(futures):
            book = futures[future]
            try:
                result = future.result()
                if result:
                    found[book["id"]] = result
            except Exception as error:
                errors.append(f"{book['title']}: {error}")
    catalogue = json.loads(BOOKS.read_text())
    assigned = 0
    for category in catalogue:
        for book in category["books"]:
            records = [book, *(book.get("seriesBooks") or [])]
            for record in records:
                if not isinstance(record, dict) or record.get("cover") or record["id"] not in found:
                    continue
                name, content = found[record["id"]]
                output = ROOT / "covers" / name
                if not output.exists():
                    output.write_bytes(content)
                record["cover"] = "covers/" + name
                assigned += 1
            parts = book.get("seriesBooks") or []
            if not book.get("cover") and parts and isinstance(parts[0], dict):
                book["cover"] = parts[0].get("cover")
    BOOKS.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "google-cover-errors.txt").write_text("\n".join(errors) + ("\n" if errors else ""))
    print(f"Google Books covers assigned: {assigned}; errors: {len(errors)}")

if __name__ == "__main__":
    main()
