interface CategoryProps {
  children: string;
  className?: string;
}

export function Category({ children, className = "" }: CategoryProps) {
  return (
    <span className={`mono-cat${className ? ` ${className}` : ""}`}>
      [ {children} ]
    </span>
  );
}
