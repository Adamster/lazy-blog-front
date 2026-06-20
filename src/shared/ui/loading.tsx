interface IProps {
  inline?: boolean;
  compensateHeader?: boolean;
}

/**
 * Brutalist-Mono loading indicator. A 2px square ring with an accent top edge
 * spinning in place — the terminal counterpart to a soft spinner (no radius, no
 * easing tricks). `inline` centers it in flow; the block form fills the viewport
 * and (by default) compensates for the fixed header.
 */
export const Loading = ({
  inline = false,
  compensateHeader = true,
}: IProps) => {
  const box = inline ? 20 : 28;

  return (
    <div
      className={
        inline
          ? "my-6 flex justify-center"
          : `flex min-h-screen items-center justify-center ${
              compensateHeader ? "-mt-16" : ""
            }`
      }
    >
      <span
        role="status"
        aria-label="Loading"
        className="block animate-spin border-2 border-[var(--m-dim)] border-t-[var(--m-accent)]"
        style={{ width: box, height: box }}
      />
    </div>
  );
};
