import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildMonthlySeries, seriesFromMonths } from "./sparkline";

describe("buildMonthlySeries", () => {
  it("returns a continuous run of N consecutive months (oldest → newest)", () => {
    const series = buildMonthlySeries(["2024-03-10T00:00:00Z"], 6);
    expect(series).toHaveLength(6);
    // Window is anchored at the most recent date's month (March), so the run is
    // Oct → Mar with no gaps.
    expect(series.map((s) => s.label)).toEqual([
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ]);
  });

  it("counts multiple dates into their month bucket, zero-filling gaps", () => {
    const series = buildMonthlySeries(
      ["2024-01-05T00:00:00Z", "2024-01-20T00:00:00Z", "2024-03-01T00:00:00Z"],
      3
    );
    // Anchored at March: Jan(2) Feb(0) Mar(1).
    expect(series.map((s) => s.count)).toEqual([2, 0, 1]);
  });

  it("accepts Date objects as well as ISO strings", () => {
    const series = buildMonthlySeries([new Date("2024-03-10T00:00:00Z")], 2);
    expect(series).toHaveLength(2);
    expect(series.at(-1)?.label).toBe("Mar");
  });

  it("ignores invalid dates", () => {
    const series = buildMonthlySeries(
      ["not-a-date", "2024-03-10T00:00:00Z"],
      1
    );
    expect(series).toHaveLength(1);
    expect(series[0].count).toBe(1);
  });

  it("respects a custom month window length", () => {
    expect(buildMonthlySeries(["2024-03-10T00:00:00Z"], 12)).toHaveLength(12);
  });

  describe("with a fixed clock (empty / anchorNow)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T00:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("falls back to the current month when there are no dates", () => {
      const series = buildMonthlySeries([], 3);
      expect(series).toHaveLength(3);
      expect(series.at(-1)?.label).toBe("Jun");
      expect(series.every((s) => s.count === 0)).toBe(true);
    });

    it("anchorNow ignores the data window and uses the current month", () => {
      const series = buildMonthlySeries(["2020-01-01T00:00:00Z"], 3, true);
      // Anchored at "now" (June), not the 2020 data point.
      expect(series.at(-1)?.label).toBe("Jun");
    });
  });
});

describe("seriesFromMonths", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps 1-based PostsPerMonth onto a rolling window anchored at now", () => {
    // April(4) and June(6); the window is Jan → Jun anchored at the clock.
    const series = seriesFromMonths([
      { year: 2024, month: 4, count: 3 },
      { year: 2024, month: 6, count: 5 },
    ]);
    expect(series.map((s) => s.label)).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
    ]);
    expect(series.map((s) => s.count)).toEqual([0, 0, 0, 3, 0, 5]);
  });

  it("zero-fills an empty input across the whole window", () => {
    const series = seriesFromMonths([]);
    expect(series).toHaveLength(6);
    expect(series.every((s) => s.count === 0)).toBe(true);
  });

  it("drops months outside the rolling window", () => {
    const series = seriesFromMonths([{ year: 2023, month: 1, count: 9 }]);
    expect(series.every((s) => s.count === 0)).toBe(true);
  });

  it("respects a custom window length", () => {
    expect(seriesFromMonths([], 3)).toHaveLength(3);
  });
});
