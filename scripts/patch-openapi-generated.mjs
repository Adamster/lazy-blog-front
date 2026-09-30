import { readFileSync, writeFileSync } from "node:fs";

const shelfCatalogItemPath = new URL(
  "../src/shared/api/openapi/models/ShelfCatalogItem.ts",
  import.meta.url,
);
const source = readFileSync(shelfCatalogItemPath, "utf8");
const patched = source
  .replaceAll("ShelfCatalogItemShelfBookCard", "ShelfBookCard")
  .replaceAll("ShelfCatalogItemShelfSeriesCard", "ShelfSeriesCard");

if (source !== patched) {
  writeFileSync(shelfCatalogItemPath, patched);
}
