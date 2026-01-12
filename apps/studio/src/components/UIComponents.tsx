"use client";

import React, { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";

interface ComponentCardProps {
  component: {
    name: string;
    category: string;
    code: string;
  };
  onSelect?: (component: any) => void;
}

export function ComponentCard({
  component,
  onSelect,
}: ComponentCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(component.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 className="font-semibold text-gray-900">{component.name}</h3>
        <p className="text-xs text-gray-500 mt-1">
          Category: {component.category}
        </p>
      </div>

      <div className="p-4">
        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
          <code>{component.code.substring(0, 200)}...</code>
        </pre>
      </div>

      <div className="p-4 flex gap-2 border-t border-gray-100">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Code
            </>
          )}
        </button>
        {onSelect && (
          <button
            onClick={() => onSelect(component)}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-900 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}

interface LibraryGridProps {
  components: any[];
  onSelectComponent?: (component: any) => void;
}

export function ComponentLibraryGrid({
  components,
  onSelectComponent,
}: LibraryGridProps) {
  if (components.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-gray-500">No components found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {components.map((component, index) => (
        <ComponentCard
          key={index}
          component={component}
          onSelect={onSelectComponent}
        />
      ))}
    </div>
  );
}

interface ColorSwatchProps {
  color: string;
  label: string;
  onChange?: (color: string) => void;
}

export function ColorSwatch({
  color,
  label,
  onChange,
}: ColorSwatchProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-12 h-12 rounded cursor-pointer border border-gray-300"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

interface TabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  actionLabel = "Save",
  onAction,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          {onAction && (
            <button
              onClick={onAction}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface NotificationProps {
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  onClose?: () => void;
}

export function Notification({
  type,
  title,
  message,
  onClose,
}: NotificationProps) {
  const bgColor = {
    success: "bg-green-50",
    error: "bg-red-50",
    info: "bg-blue-50",
    warning: "bg-yellow-50",
  }[type];

  const borderColor = {
    success: "border-green-200",
    error: "border-red-200",
    info: "border-blue-200",
    warning: "border-yellow-200",
  }[type];

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
    warning: "text-yellow-800",
  }[type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`${textColor} font-semibold`}>{title}</h3>
          <p className={`${textColor} text-sm mt-1 opacity-90`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${textColor} hover:opacity-70`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[size];

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClass} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
      />
    </div>
  );
}
