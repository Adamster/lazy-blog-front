import { describe, expect, it } from "vitest";
import { formatDate, formatDate2, snakeToTitle, titleToSnake } from "./utils";

describe("snakeToTitle / titleToSnake", () => {
  it("converts snake_case tags to spaced words", () => {
    expect(snakeToTitle("web_dev_tips")).toBe("web dev tips");
  });

  it("converts spaced words back to snake_case", () => {
    expect(titleToSnake("web dev tips")).toBe("web_dev_tips");
  });

  it("collapses runs of whitespace into a single underscore", () => {
    expect(titleToSnake("web   dev")).toBe("web_dev");
  });

  it("round-trips a simple tag", () => {
    expect(titleToSnake(snakeToTitle("react_query"))).toBe("react_query");
  });
});

describe("formatDate2 (absolute date)", () => {
  it("formats a valid date as 'd MMM yyyy'", () => {
    expect(formatDate2("2024-03-09T00:00:00Z")).toBe("9 Mar 2024");
  });

  it("formats a Date object", () => {
    expect(formatDate2(new Date("2024-12-25T00:00:00Z"))).toBe("25 Dec 2024");
  });

  it("returns 'Invalid date' for an unparseable input", () => {
    expect(formatDate2("nonsense")).toBe("Invalid date");
  });
});

describe("formatDate (relative date)", () => {
  it("returns a relative, suffixed string for a valid date", () => {
    const result = formatDate(new Date(Date.now() - 60 * 60 * 1000));
    expect(result).toMatch(/ago$/);
  });

  it("returns 'Invalid date' for an unparseable input", () => {
    expect(formatDate("nope")).toBe("Invalid date");
  });
});
