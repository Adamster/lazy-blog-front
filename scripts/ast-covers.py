"""Replace matching shelf covers with official AST Exclusive Classics editions."""

from __future__ import annotations

import concurrent.futures
import hashlib
import html
import io
import json
import re
import unicodedata
import urllib.request
from pathlib import Path

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1] / "public/books"
BOOKS = ROOT / "books.json"
SERIES = "https://ast.ru/series/eksklyuzivnaya-klassika-1077509/"
TITLE_ALIASES = {
    "Книга кладбища": "История с кладбищем",
    "Каравал": "Караваль",
}


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower().replace("ё", "е"))
    return "".join(char for char in text if char.isalnum())


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read()


def parse(page: bytes) -> list[dict]:
    text = page.decode("utf-8")
    result = []
    for part in re.split(r'<div class="card card--mini', text)[1:]:
        title = re.search(r'class="card__title[^>]+title="([^"]+)', part, re.S)
        author = re.search(r'class="card__text[^>]*>([^<]+)', part)
        image = re.search(r'https://cdn\.ast\.ru/[^\s,]+cover1__w340\.jpg', part)
        if title and author and image:
            result.append({"title": html.unescape(title[1]),
                           "author": html.unescape(author[1]).strip(),
                           "url": image[0].replace("__w340.jpg", "__w600.jpg")})
    return result


def listing(page: int) -> list[dict]:
    url = SERIES if page == 1 else f"{SERIES}?CODE=eksklyuzivnaya-klassika-1077509&PAGEN_1={page}"
    return parse(fetch(url))


def match(book: dict, editions: list[dict]) -> dict | None:
    title = norm(TITLE_ALIASES.get(book["title"], book["title"]))
    if not title:
        return None
    book_author = {norm(word) for word in re.findall(r"[\w-]+", book["author"]) if len(norm(word)) >= 4}
    ranked = []
    for item in editions:
        edition_title = norm(item["title"])
        exact = title == edition_title
        contained = len(title) >= 8 and title in edition_title
        if not (exact or contained):
            continue
        edition_author = {norm(word) for word in re.findall(r"[\w-]+", item["author"]) if len(norm(word)) >= 4}
        author_overlap = len(book_author & edition_author)
        if not author_overlap and not exact:
            continue
        ranked.append((int(exact), author_overlap, -len(edition_title), item))
    if not ranked:
        return None
    ranked.sort(key=lambda row: row[:3], reverse=True)
    # Short generic titles can collide with another author's book.
    if len(title) < 12 and not ranked[0][1]:
        return None
    return ranked[0][3]


def main() -> None:
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        pages = list(pool.map(listing, range(1, 56)))
    editions = [item for page in pages for item in page]
    print(f"AST editions: {len(editions)}", flush=True)
    catalogue = json.loads(BOOKS.read_text())
    targets = []
    for category in catalogue:
        for book in category["books"]:
            choice = match(book, editions)
            if choice:
                targets.append((book, choice))
            for part in book.get("seriesBooks") or []:
                if isinstance(part, dict):
                    choice = match(part, editions)
                    if choice:
                        targets.append((part, choice))
    print(f"Matched books: {len(targets)}", flush=True)
    by_url = {}
    for book, edition in targets:
        by_url.setdefault(edition["url"], []).append((book, edition))
    loaded, failures = 0, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(fetch, url): url for url in by_url}
        for future in concurrent.futures.as_completed(futures):
            url = futures[future]
            try:
                content = future.result()
                picture = Image.open(io.BytesIO(content))
                if picture.width < 480 or picture.height < 600:
                    raise ValueError(f"small cover {picture.size}")
                sample = ImageStat.Stat(picture.convert("RGB").resize((32, 32)))
                if max(sample.stddev) < 8 and min(sample.mean) > 235:
                    raise ValueError("blank publisher placeholder")
                name = hashlib.sha1(content).hexdigest()[:24] + ".jpg"
                output = ROOT / "covers" / name
                if not output.exists():
                    output.write_bytes(content)
                for book, edition in by_url[url]:
                    book["cover"] = "covers/" + name
                    loaded += 1
                if loaded % 20 == 0:
                    print(f"Downloaded {loaded}/{len(targets)}", flush=True)
            except Exception as error:
                failures.append(f"{url}: {error}")
    BOOKS.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
    print(f"AST covers assigned: {loaded}; failures: {len(failures)}", flush=True)
    (ROOT / "ast-cover-failures.txt").write_text("\n".join(failures))


if __name__ == "__main__":
    main()
