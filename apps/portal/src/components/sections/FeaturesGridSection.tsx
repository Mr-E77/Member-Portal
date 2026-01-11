// apps/portal/src/components/sections/FeaturesGridSection.tsx
import { Section } from "@mre/ui";

export function FeaturesGridSection() {
  const features = [
    {
      title: "Member Dashboard",
      description: "Access your personalized dashboard with all your membership tools.",
      icon: "📊"
    },
    {
      title: "Flexible Tiers",
      description: "Choose from four membership tiers designed to grow with your needs.",
      icon: "🎯"
    },
    {
      title: "Secure Authentication",
      description: "Multiple sign-in options to keep your account safe and accessible.",
      icon: "🔒"
    },
    {
      title: "Profile Management",
      description: "Manage your Mr.E Profile with ease and customize your experience.",
      icon: "👤"
    }
  ];

  return (
    <Section className="bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
