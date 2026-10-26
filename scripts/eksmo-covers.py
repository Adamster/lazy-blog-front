"""Fill remaining cover gaps from official Eksmo book editions."""

from __future__ import annotations

import concurrent.futures
import hashlib
import html
import importlib.util
import io
import json
import re
import urllib.parse
from pathlib import Path

from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1] / "public/books"
BOOKS = ROOT / "books.json"
spec = importlib.util.spec_from_file_location("ast_covers", Path(__file__).with_name("ast-covers.py"))
ast = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ast)


def search(book: dict) -> dict | None:
    url = "https://eksmo.ru/search/book/?q=" + urllib.parse.quote(book["title"])
    data = ast.fetch(url).decode("utf-8")
    editions = []
    for part in re.split(r'<div class="books__item book"', data)[1:]:
        heading = part.split(">", 1)[0]
        title = re.search(r'<div class="book__name">([^<]+)', part)
        author = re.search(r'<div class="book__author">([^<]+)', part)
        image = re.search(r'data-src="(https://cdn\.eksmo\.ru/[^\"]+cover1__w\d+\.jpg[^\"]*)"', part)
        if title and author and image:
            image_url = re.sub(r'__w\d+\.jpg', '__w600.jpg', image[1])
            editions.append({"title": html.unescape(title[1]),
                             "author": html.unescape(author[1]),
                             "url": image_url,
                             "paper": 'data-format="paper"' in heading})
    paper = [item for item in editions if item["paper"]]
    return ast.match(book, paper) or ast.match(book, editions)


def cover(url: str) -> tuple[str, bytes]:
    content = ast.fetch(url)
    image = Image.open(io.BytesIO(content))
    if image.width < 480 or image.height < 600:
        raise ValueError(f"small cover {image.size}")
    sample = ImageStat.Stat(image.convert("RGB").resize((32, 32)))
    if max(sample.stddev) < 8 and min(sample.mean) > 235:
        raise ValueError("blank publisher placeholder")
    return hashlib.sha1(content).hexdigest()[:24] + ".jpg", content


def main() -> None:
    catalogue = json.loads(BOOKS.read_text())
    targets = []
    for category in catalogue:
        for book in category["books"]:
            if not book.get("cover") and not book.get("seriesBooks"):
                targets.append(book)
            for part in book.get("seriesBooks") or []:
                if isinstance(part, dict) and not part.get("cover"):
                    targets.append(part)
    print(f"Search Eksmo catalogue for {len(targets)} books", flush=True)
    choices, errors = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(search, book): book for book in targets}
        for future in concurrent.futures.as_completed(futures):
            book = futures[future]
            try:
                edition = future.result()
                if edition:
                    choices.append((book, edition))
            except Exception as error:
                errors.append(f"{book['title']}: {error}")
    print(f"Eksmo matches: {len(choices)}", flush=True)
    by_url = {}
    for book, edition in choices:
        by_url.setdefault(edition["url"], []).append(book)
    assigned = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(cover, url): url for url in by_url}
        for future in concurrent.futures.as_completed(futures):
            url = futures[future]
            try:
                name, data = future.result()
                output = ROOT / "covers" / name
                if not output.exists():
                    output.write_bytes(data)
                for book in by_url[url]:
                    book["cover"] = "covers/" + name
                    assigned += 1
            except Exception as error:
                errors.append(f"{url}: {error}")
    for category in catalogue:
        for book in category["books"]:
            parts = book.get("seriesBooks") or []
            if not book.get("cover") and parts and isinstance(parts[0], dict):
                book["cover"] = parts[0].get("cover")
    BOOKS.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
    print(f"Eksmo covers assigned: {assigned}; lookup errors: {len(errors)}", flush=True)
    (ROOT / "eksmo-cover-errors.txt").write_text("\n".join(errors) + ("\n" if errors else ""))


if __name__ == "__main__":
    main()
