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
    <Section className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Platform Features</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Everything you need to manage your membership and connect with your community.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow text-center group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
