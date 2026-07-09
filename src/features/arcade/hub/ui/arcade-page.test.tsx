import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
vi.mock("@/entities/session", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseTetrisLeaderboard = vi.fn();
vi.mock("@/features/arcade/tetris", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/arcade/tetris")
  >("@/features/arcade/tetris");
  return {
    ...actual,
    useTetrisLeaderboard: () => mockUseTetrisLeaderboard(),
  };
});

const mockUseSnakeClassicLeaderboard = vi.fn();
vi.mock("@/features/arcade/snake-classic", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/arcade/snake-classic")
  >("@/features/arcade/snake-classic");
  return {
    ...actual,
    useSnakeClassicLeaderboard: () => mockUseSnakeClassicLeaderboard(),
  };
});

const mockUse2048Leaderboard = vi.fn();
vi.mock("@/features/arcade/2048", async () => {
  const actual = await vi.importActual<typeof import("@/features/arcade/2048")>(
    "@/features/arcade/2048"
  );
  return {
    ...actual,
    use2048Leaderboard: () => mockUse2048Leaderboard(),
  };
});

import { ArcadePage } from "./arcade-page";

const NO_DATA = { data: undefined, isLoading: false } as const;

const entry = (userName: string, bestScore: number) => ({
  rank: 1,
  userName,
  avatarUrl: null,
  bestScore,
  gamesPlayed: 9,
});

describe("ArcadePage leaderboard rows", () => {
  it("shows 3 placeholder rows per card when signed out", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUseTetrisLeaderboard.mockReturnValue(NO_DATA);
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    // 3 visible cards x 3 rows each.
    expect(screen.getAllByRole("img", { name: "No score yet" })).toHaveLength(
      9
    );
  });

  it("shows 3 placeholder rows for a game with an empty leaderboard", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: { entries: [] },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getAllByRole("img", { name: "No score yet" })).toHaveLength(
      9
    );
  });

  it("shows the #1 leader's handle and score, padding the other 2 rows", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: { entries: [entry("igormariuta", 12400)] },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getByText("@igormariuta")).toBeInTheDocument();
    expect(screen.getByText("12,400")).toBeInTheDocument();
    // Tetris's own rows 2-3, plus 3 rows each for the other 2 games.
    expect(screen.getAllByRole("img", { name: "No score yet" })).toHaveLength(
      8
    );
  });

  it("shows all 3 ranked entries with a rank badge each when a game has 3+ scores", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: {
        entries: [
          entry("first", 500),
          entry("second", 400),
          entry("third", 300),
        ],
      },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getByText("@first")).toBeInTheDocument();
    expect(screen.getByText("@second")).toBeInTheDocument();
    expect(screen.getByText("@third")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
    // Rank badges 1/2/3 render as their own text nodes next to each handle.
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("links each leader's handle to their profile", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: { entries: [entry("igormariuta", 12400)] },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getByText("@igormariuta").closest("a")).toHaveAttribute(
      "href",
      "/u/igormariuta"
    );
  });
});
