// apps/studio/src/app/configs/new/page.tsx
import { ConfigEditor } from "@/components/ConfigEditor";
import { genericConfig } from "@portal/config/genericConfig";

export default function NewConfigPage() {
  const initialConfig = JSON.parse(JSON.stringify(genericConfig)) as typeof genericConfig;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Create New Configuration</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <ConfigEditor initialConfig={initialConfig} mode="create" />
      </main>
    </div>
  );
}
