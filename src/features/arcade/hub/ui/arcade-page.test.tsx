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

describe("ArcadePage leaderboard row", () => {
  it("shows the placeholder when signed out", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUseTetrisLeaderboard.mockReturnValue(NO_DATA);
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getAllByText("NO SCORES YET")).toHaveLength(3);
  });

  it("shows the placeholder for a game with an empty leaderboard", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: { entries: [] },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getAllByText("NO SCORES YET")).toHaveLength(3);
  });

  it("shows the #1 leader's handle and score when present", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: {
        entries: [
          {
            rank: 1,
            userName: "igormariuta",
            avatarUrl: null,
            bestScore: 12400,
            gamesPlayed: 9,
          },
        ],
      },
      isLoading: false,
    });
    mockUseSnakeClassicLeaderboard.mockReturnValue(NO_DATA);
    mockUse2048Leaderboard.mockReturnValue(NO_DATA);

    render(<ArcadePage />);

    expect(screen.getByText("@igormariuta")).toBeInTheDocument();
    expect(screen.getByText("12,400")).toBeInTheDocument();
    // The other 2 games still fall back to the placeholder.
    expect(screen.getAllByText("NO SCORES YET")).toHaveLength(2);
  });

  it("links the leader's handle to their profile", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseTetrisLeaderboard.mockReturnValue({
      data: {
        entries: [
          {
            rank: 1,
            userName: "igormariuta",
            avatarUrl: null,
            bestScore: 12400,
            gamesPlayed: 9,
          },
        ],
      },
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
