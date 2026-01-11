// apps/portal/src/components/sections/MembershipTiersSection.tsx
import { TierCard } from "@mre/ui";
import { PortalConfig } from "@/config/types";

interface MembershipTiersSectionProps {
  config: PortalConfig;
}

export function MembershipTiersSection({ config }: MembershipTiersSectionProps) {
  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Membership Tiers</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Choose the tier that best fits your needs. Upgrade anytime as you grow.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {config.membershipTiers.map((tier) => (
            <TierCard
              key={tier.id}
              name={tier.name}
              description={tier.description}
              features={tier.features}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
