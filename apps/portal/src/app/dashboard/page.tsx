// apps/portal/src/app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaticConfig } from "@/config";
import { TierCard } from "@mre/ui";
import { UpgradeButton } from "@/components/UpgradeButton";
import { UpgradeStatusMessage } from "@/components/UpgradeStatusMessage";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/");
  }

  const config = getStaticConfig(
    (process.env.NEXT_PUBLIC_PRESET as "generic" | "campus-sound") || "generic"
  );

  const currentTier = config.membershipTiers.find(
    (t) => t.id === user.membershipTier
  ) || config.membershipTiers[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-gray-900">{config.platformName}</h1>
          </Link>
          <Link
            href="/profile"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            My Profile
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <UpgradeStatusMessage />
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome to {config.platformName}, {user.name || session.user.email}!
          </h2>
          <p className="text-gray-600">
            This is your Mr.E Profile – manage your membership and settings.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Current Membership</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              {currentTier.name}
            </div>
            <p className="text-gray-600">{currentTier.description}</p>
          </div>
          <ul className="space-y-2">
            {currentTier.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <SubscriptionManager />
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-6">Available Membership Tiers</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {config.membershipTiers.map((tier) => (
              <div key={tier.id} className="flex flex-col">
                <TierCard
                  name={tier.name}
                  description={tier.description}
                  features={tier.features}
                  isCurrent={tier.id === user.membershipTier}
                  onSelect={() => {}}
                />
                <div className="mt-4">
                  <UpgradeButton
                    tierId={tier.id}
                    tierName={tier.name}
                    currentTier={user.membershipTier}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
