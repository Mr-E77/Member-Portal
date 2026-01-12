"use client";

import { useState } from "react";
import {
  Download,
  Copy,
  Check,
  Code,
  FileJson,
  Package,
} from "lucide-react";
import { Modal, Notification } from "./UIComponents";

interface ExportFormat {
  id: string;
  label: string;
  description: string;
  icon: any;
}

interface CodeExporterProps {
  configId: string;
}

export function CodeExporter({ configId }: CodeExporterProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const formats: ExportFormat[] = [
    {
      id: "react",
      label: "React Component",
      description: "Export as TSX component",
      icon: Code,
    },
    {
      id: "json",
      label: "Configuration JSON",
      description: "Save configuration as JSON",
      icon: FileJson,
    },
    {
      id: "package",
      label: "NPM Package",
      description: "Generate installable package",
      icon: Package,
    },
  ];

  const generateCode = async (format: string) => {
    try {
      const response = await fetch(`/api/export/${configId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const { code } = await response.json();
        setGeneratedCode(code);
        setSelectedFormat(format);
      } else {
        throw new Error("Failed to generate code");
      }
    } catch (error) {
      console.error("Error generating code:", error);
      setNotification({
        type: "error",
        message: "Failed to generate code",
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setNotification({
      type: "success",
      message: "Code copied to clipboard!",
    });
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `studio-export-${Date.now()}.${
      selectedFormat === "json" ? "json" : "tsx"
    }`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setNotification({
      type: "success",
      message: "File downloaded!",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Export & Code Generation</h2>
        <p className="text-gray-600">
          Generate code and export your studio configuration in various formats
        </p>
      </div>

      {/* Format Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {formats.map((format) => {
          const Icon = format.icon;
          return (
            <button
              key={format.id}
              onClick={() => generateCode(format.id)}
              className={`p-6 border-2 rounded-lg transition-all text-left hover:shadow-md ${
                selectedFormat === format.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-8 h-8 text-gray-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">
                {format.label}
              </h3>
              <p className="text-sm text-gray-600">{format.description}</p>
            </button>
          );
        })}
      </div>

      {/* Code Preview */}
      {generatedCode && (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gray-800 px-6 py-3 flex justify-between items-center">
            <p className="text-gray-400 text-sm font-mono">
              {selectedFormat?.toUpperCase()} Code
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadCode}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="max-h-96 overflow-y-auto p-6">
            <pre className="text-gray-100 text-xs font-mono leading-relaxed">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </div>
      )}

      {!generatedCode && (
        <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
          <Code className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>Select a format above to generate code</p>
        </div>
      )}

      {/* Export Instructions */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">Export Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            • <strong>React Component:</strong> Export your design as a reusable
            React component
          </li>
          <li>
            • <strong>Configuration JSON:</strong> Save all your settings and
            theme data
          </li>
          <li>
            • <strong>NPM Package:</strong> Create a publishable npm package
            from your studio
          </li>
        </ul>
      </div>
    </div>
  );
}
