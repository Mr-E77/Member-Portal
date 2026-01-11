"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PortalConfig, AuthProviderOption, PortalSectionConfig } from "@portal/config/types";

interface ConfigEditorProps {
  initialConfig: PortalConfig;
  mode: "create" | "edit";
  configId?: string;
}

function SortableSectionItem({
  section,
  onToggle,
}: {
  section: PortalSectionConfig;
  onToggle: (type: PortalSectionConfig["type"], enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.type,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-white border rounded-md px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="cursor-grab text-gray-500 hover:text-gray-700"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div>
          <p className="font-medium capitalize">{section.type.replace("-", " ")}</p>
          <p className="text-sm text-gray-500">Order: {section.order}</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={section.enabled}
          onChange={(e) => onToggle(section.type, e.target.checked)}
        />
        Enabled
      </label>
    </div>
  );
}

export function ConfigEditor({ initialConfig, mode, configId }: ConfigEditorProps) {
  const router = useRouter();
  const [config, setConfig] = useState<PortalConfig>(() => ({
    ...initialConfig,
    sections: [...initialConfig.sections].sort((a, b) => a.order - b.order),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectionIds = useMemo(() => config.sections.map((s) => s.type), [config.sections]);

  const updateSectionOrder = (newSections: PortalSectionConfig[]) => {
    setConfig((prev) => ({
      ...prev,
      sections: newSections.map((section, idx) => ({
        ...section,
        order: idx + 1,
      })),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sectionIds.indexOf(active.id as string);
    const newIndex = sectionIds.indexOf(over.id as string);

    const newOrder = arrayMove(config.sections, oldIndex, newIndex);
    updateSectionOrder(newOrder);
  };

  const toggleSectionEnabled = (type: PortalSectionConfig["type"], enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.type === type ? { ...section, enabled } : section
      ),
    }));
  };

  const toggleAuthOption = (option: AuthProviderOption) => {
    setConfig((prev) => {
      const exists = prev.authOptions.includes(option);
      return {
        ...prev,
        authOptions: exists
          ? prev.authOptions.filter((o) => o !== option)
          : [...prev.authOptions, option],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      name: config.platformName,
      preset: config.preset,
      data: {
        ...config,
        sections: config.sections.map((section, idx) => ({
          ...section,
          order: idx + 1,
        })),
      },
    };

    try {
      const response = await fetch(
        mode === "create" ? "/api/configs" : `/api/configs/${configId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Preset</label>
        <select
          value={config.preset}
          onChange={(e) => setConfig({ ...config, preset: e.target.value as PortalConfig["preset"] })}
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
                checked={config.authOptions.includes(option as AuthProviderOption)}
                onChange={() => toggleAuthOption(option as AuthProviderOption)}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Sections (drag to reorder)</label>
          <span className="text-xs text-gray-500">Order updates automatically</span>
        </div>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {config.sections.map((section) => (
                <SortableSectionItem
                  key={section.type}
                  section={section}
                  onToggle={toggleSectionEnabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : mode === "create" ? "Save Configuration" : "Update Configuration"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
