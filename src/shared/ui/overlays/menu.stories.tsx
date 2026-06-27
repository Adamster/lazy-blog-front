import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  PencilIcon,
  TrashIcon,
  ShareIcon,
  FlagIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Menu, type MenuItem } from "./menu";

// Items defined at module level — they contain JSX so they cannot be args.

const POST_ITEMS: MenuItem[] = [
  {
    id: "edit",
    label: "Edit",
    icon: <PencilIcon />,
    onSelect: () => {},
  },
  {
    id: "share",
    label: "Share",
    icon: <ShareIcon />,
    onSelect: () => {},
  },
  {
    id: "delete",
    label: "Delete",
    icon: <TrashIcon />,
    onSelect: () => {},
    danger: true,
  },
];

const COMMENT_ITEMS: MenuItem[] = [
  {
    id: "edit",
    label: "Edit",
    icon: <PencilIcon />,
    onSelect: () => {},
  },
  {
    id: "delete",
    label: "Delete",
    icon: <TrashIcon />,
    onSelect: () => {},
    danger: true,
  },
];

const READER_ITEMS: MenuItem[] = [
  {
    id: "view",
    label: "View",
    icon: <EyeIcon />,
    onSelect: () => {},
  },
  {
    id: "share",
    label: "Share",
    icon: <ShareIcon />,
    onSelect: () => {},
  },
  {
    id: "report",
    label: "Report",
    icon: <FlagIcon />,
    onSelect: () => {},
    danger: true,
  },
];

const meta = {
  title: "Overlays/Menu",
  component: Menu,
  // Satisfies required props so render-only stories don't need args.
  args: { items: [] as MenuItem[], triggerLabel: "Options" },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Post author kebab — Edit / Share / Delete. */
export const PostMenu: Story = {
  render: () => (
    <div className="flex items-center justify-end p-4">
      <Menu items={POST_ITEMS} triggerLabel="Post options" />
    </div>
  ),
};

/** Comment author kebab — Edit / Delete. */
export const CommentMenu: Story = {
  render: () => (
    <div className="flex items-center justify-end p-4">
      <Menu items={COMMENT_ITEMS} triggerLabel="Comment options" />
    </div>
  ),
};

/** Reader kebab — View / Share / Report. */
export const ReaderMenu: Story = {
  render: () => (
    <div className="flex items-center justify-end p-4">
      <Menu items={READER_ITEMS} triggerLabel="More options" />
    </div>
  ),
};
