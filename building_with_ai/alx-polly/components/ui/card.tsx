// Minimal Shadcn Card component placeholder
import * as React from "react";

export function Card({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm ${className ?? ""}`}>
      {children}
    </div>
  );
}
