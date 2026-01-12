"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AIChatWindow } from "@/components/AIChatWindow";

interface Config {
  id: string;
  name: string;
  preset: string;
  updatedAt: Date;
}

export default function HomePage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfigs() {
      try {
        const response = await fetch("/api/configs");
        const data = await response.json();
        setConfigs(data);
      } catch (error) {
        console.error("Failed to load configs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConfigs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Portal Design Studio</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Portal Configurations</h2>
          <Link
            href="/configs/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create New Config
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : configs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No configurations found</p>
            <Link
              href="/configs/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Create Your First Config
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config) => (
              <Link
                key={config.id}
                href={`/configs/${config.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{config.name}</h3>
                <p className="text-gray-600 mb-4">Preset: {config.preset}</p>
                <p className="text-sm text-gray-500">
                  Updated:{" "}
                  {new Date(config.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Global AI Chat - available on any page */}
      {configs.length > 0 && <AIChatWindow configId={configs[0].id} />}
    </div>
  );
}
