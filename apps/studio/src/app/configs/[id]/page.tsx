import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ConfigEditor } from "@/components/ConfigEditor";
import type { PortalConfig } from "@portal/config/types";

interface ConfigPageProps {
  params: { id: string };
}

export default async function ConfigPage({ params }: ConfigPageProps) {
  const record = await prisma.portalConfigModel.findUnique({
    where: { id: params.id },
  });

  if (!record) {
    return notFound();
  }

  const data = record.data as PortalConfig;
  const initialConfig: PortalConfig = {
    ...data,
    sections: [...(data.sections ?? [])].sort((a, b) => a.order - b.order),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-500">Editing</p>
          <h1 className="text-2xl font-bold">{record.name}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <ConfigEditor initialConfig={initialConfig} mode="edit" configId={record.id} />
      </main>
    </div>
  );
}
