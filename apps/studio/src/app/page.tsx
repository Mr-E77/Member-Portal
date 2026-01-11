import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const configs = await prisma.portalConfigModel.findMany({
    orderBy: { updatedAt: "desc" },
  });

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

        {configs.length === 0 ? (
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
                  Updated: {config.updatedAt?.toLocaleDateString?.() ?? ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
