import type { Meta, StoryObj } from "@storybook/react-vite";
import { MediaEmbed } from "./media-embed";

const meta = {
  title: "Prose/MediaEmbed",
  component: MediaEmbed,
  args: {
    embed: { kind: "youtube", id: "dQw4w9WgXcQ" },
  },
} satisfies Meta<typeof MediaEmbed>;

export default meta;
type Story = StoryObj<typeof meta>;

/** YouTube — 16:9 responsive iframe inside the 2px brutalist frame. */
export const YouTube: Story = {
  args: {
    embed: { kind: "youtube", id: "dQw4w9WgXcQ" },
  },
};

/** Spotify track — compact 152px player height. */
export const SpotifyTrack: Story = {
  args: {
    embed: { kind: "spotify", type: "track", id: "4cOdK2wGLETKBW3PvgPWqT" },
  },
};

/** Spotify playlist — taller 352px list player. */
export const SpotifyPlaylist: Story = {
  args: {
    embed: {
      kind: "spotify",
      type: "playlist",
      id: "37i9QTkFZHToNEXhK1KCAQ",
    },
  },
};
