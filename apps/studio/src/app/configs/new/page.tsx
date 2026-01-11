// apps/studio/src/app/configs/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PortalConfig, MembershipTier, AuthProviderOption } from "@portal/config/types";

export default function NewConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Partial<PortalConfig>>({
    preset: "generic",
    platformName: "My Platform",
    organizationName: "My Organization",
    heroTitle: "Welcome",
    heroSubtitle: "Your subtitle here",
    authOptions: ["email-password"],
    membershipTiers: [
      {
        id: "tier1",
        name: "Starter",
        description: "Basic tier",
        features: ["Feature 1", "Feature 2"]
      }
    ],
    sections: [
      { type: "hero", enabled: true, order: 1 },
      { type: "login-card", enabled: true, order: 2 },
      { type: "features-grid", enabled: true, order: 3 },
      { type: "membership-tiers", enabled: true, order: 4 },
      { type: "programs", enabled: false, order: 5 },
      { type: "callout", enabled: true, order: 6 }
    ]
  });

  const handleSave = async () => {
    const response = await fetch("/api/configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: config.platformName,
        preset: config.preset,
        data: config,
      }),
    });

    if (response.ok) {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Create New Configuration</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Preset</label>
            <select
              value={config.preset}
              onChange={(e) => setConfig({ ...config, preset: e.target.value as any })}
              className="w-full border-2 border-gray-300 rounded-md px-4 py-2"
            >
              <option value="generic">Generic</option>
              <option value="campus-sound">Campus Sound</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Platform Name</label>
            <input
              type="text"
              value={config.platformName}
              onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-md px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              value={config.organizationName}
              onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-md px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hero Title</label>
            <input
              type="text"
              value={config.heroTitle}
              onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-md px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hero Subtitle</label>
            <textarea
              value={config.heroSubtitle}
              onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-md px-4 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Auth Options</label>
            <div className="space-y-2">
              {["email-password", "github", "google"].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.authOptions?.includes(option as AuthProviderOption)}
                    onChange={(e) => {
                      const authOptions = config.authOptions || [];
                      if (e.target.checked) {
                        setConfig({
                          ...config,
                          authOptions: [...authOptions, option as AuthProviderOption]
                        });
                      } else {
                        setConfig({
                          ...config,
                          authOptions: authOptions.filter((o) => o !== option)
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Save Configuration
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
