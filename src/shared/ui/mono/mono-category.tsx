interface MonoCategoryProps {
  /** Category text rendered inside `[ … ]`. */
  children: string;
  /** Extra utilities (e.g. spacing) merged onto the `.mono-cat` class. */
  className?: string;
}

/**
 * The `[ category ]` accent line shown above titles on the hero, feed cards,
 * list rows, profile cards and the post header.
 */
export function MonoCategory({ children, className = "" }: MonoCategoryProps) {
  return (
    <span className={`mono-cat${className ? ` ${className}` : ""}`}>
      [ {children} ]
    </span>
  );
}
