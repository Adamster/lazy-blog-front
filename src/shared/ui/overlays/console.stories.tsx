import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console, ConsoleTitleBar } from "./console";

const meta = {
  title: "Overlays/Console",
  component: Console,
  // Satisfies required props so render-only stories don't need args.
  args: { title: "terminal.log", children: null },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Error stacktrace panel — used on the glitch/error page. */
export const Stacktrace: Story = {
  render: () => (
    <Console title="stacktrace.log" className="max-w-[600px]">
      <div className="space-y-1">
        <p className="text-[var(--m-error)]">
          TypeError: Cannot read properties of null (reading &quot;slug&quot;)
        </p>
        <p>{"    "}at PostView (post-view.tsx:42:18)</p>
        <p>{"    "}at renderWithHooks (react-dom.development.js:23)</p>
        <p className="text-[var(--m-muted2)]">
          {"    "}at mountIndeterminateComponent (react-dom.development.js:4)
        </p>
      </div>
    </Console>
  ),
};

/** Build output — success path. */
export const BuildOutput: Story = {
  render: () => (
    <Console title="build.log" className="max-w-[500px]">
      <div className="space-y-1">
        <p>{">"} Building project…</p>
        <p>{">"} Compiling TypeScript…</p>
        <p>{">"} Bundling assets…</p>
        <p className="text-[var(--m-accent)]">{">"} Done in 1.4 s</p>
      </div>
    </Console>
  ),
};

/** Just the title bar chrome — with a blinking cursor in the trailing slot. */
export const TitleBarOnly: Story = {
  render: () => (
    <div className="max-w-[400px] border-2 border-[var(--m-dim)]">
      <ConsoleTitleBar
        title="cursor.log"
        trailing={
          <span
            className="ml-1 animate-pulse text-[var(--m-accent)]"
            aria-hidden="true"
          >
            █
          </span>
        }
      />
    </div>
  ),
};
