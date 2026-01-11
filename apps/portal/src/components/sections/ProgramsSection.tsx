// apps/portal/src/components/sections/ProgramsSection.tsx
import { Section } from "@mre/ui";

export function ProgramsSection() {
  return (
    <Section className="bg-white">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Our Programs</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore various programs and opportunities available to members.
          This section can be customized per preset.
        </p>
      </div>
    </Section>
  );
}
