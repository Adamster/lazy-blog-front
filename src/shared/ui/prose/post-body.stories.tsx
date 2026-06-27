import type { Meta, StoryObj } from "@storybook/react-vite";
import { PostBody } from "./post-body";

const KITCHEN_SINK_MD = `
## The Terminal Manifesto

This is a paragraph of **bold** and _italic_ text, with an [external link](https://example.com) and some \`inline code\`.

### Lists

- First item in the list
- Second item with more detail
- Third item closes it out

1. Ordered first
2. Ordered second
3. Ordered third

### Blockquote

> The best code is no code at all.
> Every line you write is a line you have to maintain.

### Code block

\`\`\`ts
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Table

| Column A | Column B | Column C |
|----------|----------|----------|
| Alpha    | Beta     | Gamma    |
| Delta    | Epsilon  | Zeta     |
`.trim();

const DIRECTIVES_MD = `
## Inline Directives

The agent said :glitch[SYSTEM OVERLOAD] before the connection dropped.

The matrix decoded: :matrix[FOLLOW THE WHITE RABBIT]

The spoiler is hidden: :spoiler[the hero dies at the end]

The edit was made: :strike[original draft text]

## Block Directives

::divider{variant=dots}

:::callout{type=note}
This is a **note** callout with prose body. Use it for supplementary context that supports the main text.
:::

::divider{variant=slash}

:::callout{type=warn}
**Destructive action ahead.** This step cannot be undone — verify your inputs before proceeding.
:::
`.trim();

const meta = {
  title: "Prose/PostBody",
  component: PostBody,
  args: { markdown: KITCHEN_SINK_MD },
} satisfies Meta<typeof PostBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full article prose: headings, paragraphs, lists, blockquotes, tables, code.
 * The `.mono-prose` stylesheet drives all visual treatment.
 */
export const KitchenSink: Story = {
  args: { markdown: KITCHEN_SINK_MD },
};

/**
 * All supported inline and block directives: glitch, matrix, spoiler, strike,
 * divider (dots + slash), callout (note + warn).
 */
export const Directives: Story = {
  args: { markdown: DIRECTIVES_MD },
};
