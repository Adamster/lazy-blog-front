import { useEffect, type ReactNode } from "react";
import type { Preview, Decorator } from "@storybook/react-vite";

// The design-system CSS: tailwind.css pulls in @import "tailwindcss" + the theme
// tokens + the .mono-* layer; prose.css styles the article read view.
import "../src/assets/styles/tailwind.css";
import "../src/assets/styles/prose.css";

/**
 * Mirror the app's theming: the tokens switch on the `.dark` / `.neo` classes on
 * <html> (light = neither, dark = `.dark`, neo = `.dark .neo`). Each story is
 * wrapped in `.mono-scope` so it picks up the scoped tokens + the mono font.
 */
function ThemeWrapper({
  theme,
  children,
}: {
  theme: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", theme === "dark" || theme === "neo");
    html.classList.toggle("neo", theme === "neo");
  }, [theme]);

  return (
    <div
      className="mono-scope"
      style={{
        minHeight: "100vh",
        background: "var(--m-bg)",
        color: "var(--m-fg)",
        fontFamily: "var(--font-mono)",
        padding: 40,
      }}
    >
      {children}
    </div>
  );
}

const withTheme: Decorator = (Story, context) => (
  <ThemeWrapper theme={(context.globals.theme as string) ?? "light"}>
    <Story />
  </ThemeWrapper>
);

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: "fullscreen",
  },
  globalTypes: {
    theme: {
      description: "Brutalist-Mono theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "neo", title: "Neo" },
        ],
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
