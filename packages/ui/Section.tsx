// packages/ui/Section.tsx
import React from "react";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export function Section({ children, className = "" }: SectionProps) {
  return (
    <section className={`py-12 px-4 ${className}`}>
      {children}
    </section>
  );
}
