/**
 * Pre-built Component Library
 * Modern, reusable components for the studio
 */

export const COMPONENT_LIBRARY = {
  buttons: [
    {
      name: "Primary Button",
      category: "button",
      code: `export function PrimaryButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}`,
    },
    {
      name: "Secondary Button",
      category: "button",
      code: `export function SecondaryButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
    >
      {label}
    </button>
  );
}`,
    },
    {
      name: "Danger Button",
      category: "button",
      code: `export function DangerButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      {label}
    </button>
  );
}`,
    },
  ],
  cards: [
    {
      name: "Basic Card",
      category: "card",
      code: `export function BasicCard({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  );
}`,
    },
    {
      name: "Feature Card",
      category: "card",
      code: `export function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<any>; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition-shadow">
      <div className="flex justify-center mb-4">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}`,
    },
  ],
  forms: [
    {
      name: "Text Input",
      category: "form",
      code: `export function TextInput({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}`,
    },
    {
      name: "Select Dropdown",
      category: "form",
      code: `export function SelectDropdown({ label, options, value, onChange }: { label: string; options: Array<{ label: string; value: string }>; value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}`,
    },
  ],
  layout: [
    {
      name: "Grid Container",
      category: "layout",
      code: `export function GridContainer({ cols = 3, gap = "gap-4", children }: { cols?: number; gap?: string; children: React.ReactNode }) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[cols] || "grid-cols-3";
  
  return (
    <div className={\`grid \${colClass} \${gap}\`}>
      {children}
    </div>
  );
}`,
    },
  ],
  navigation: [
    {
      name: "Tab Navigation",
      category: "navigation",
      code: `export function TabNav({ tabs, activeTab, onTabChange }: { tabs: string[]; activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <div className="border-b border-gray-200 flex gap-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={\`px-4 py-2 font-medium transition-colors \${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}\`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}`,
    },
  ],
};

export const COMPONENT_CATEGORIES = [
  { id: "all", name: "All Components" },
  { id: "button", name: "Buttons" },
  { id: "card", name: "Cards" },
  { id: "form", name: "Forms" },
  { id: "layout", name: "Layout" },
  { id: "navigation", name: "Navigation" },
];

export function getComponentsByCategory(category: string) {
  if (category === "all") {
    return Object.values(COMPONENT_LIBRARY).flat();
  }
  return COMPONENT_LIBRARY[category as keyof typeof COMPONENT_LIBRARY] || [];
}
