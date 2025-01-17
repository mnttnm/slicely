import { ReactNode } from "react";

interface EmptyPlaceholderProps {
  title: string;
  description: string;
  icon?: string;
  children?: ReactNode;
}

export function EmptyPlaceholder({
  title,
  description,
  icon,
  children,
}: EmptyPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto p-8 rounded-lg border border-dashed">
      {icon && <span className="text-4xl mb-4">{icon}</span>}
      <h3 className="text-lg font-medium mb-2 text-muted-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {children}
    </div>
  );
} 