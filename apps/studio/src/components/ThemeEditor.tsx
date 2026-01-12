"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { ColorSwatch, Notification, LoadingSpinner } from "./UIComponents";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  background: string;
  text: string;
}

interface Theme {
  id: string;
  configId: string;
  name: string;
  colors: ThemeColors;
  variables: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

interface ThemeEditorProps {
  configId: string;
  onThemeSave?: (theme: Theme) => void;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: "#3B82F6",
  secondary: "#10B981",
  accent: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  background: "#FFFFFF",
  text: "#1F2937",
};

export function ThemeEditor({ configId, onThemeSave }: ThemeEditorProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [themeName, setThemeName] = useState("New Theme");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchThemes();
  }, [configId]);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/themes/${configId}`);
      if (response.ok) {
        const data = await response.json();
        setThemes(data);
        if (data.length > 0) {
          selectTheme(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching themes:", error);
      setNotification({
        type: "error",
        message: "Failed to load themes",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    setColors(theme.colors);
    setThemeName(theme.name);
  };

  const handleColorChange = (colorKey: keyof ThemeColors, value: string) => {
    setColors((prev) => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const saveTheme = async () => {
    try {
      setLoading(true);
      const method = selectedTheme ? "PUT" : "POST";
      const url = selectedTheme
        ? `/api/themes/${configId}?themeId=${selectedTheme.id}`
        : `/api/themes/${configId}`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: themeName,
          colors,
          variables: generateCSSVariables(colors),
        }),
      });

      if (response.ok) {
        const savedTheme = await response.json();
        setNotification({
          type: "success",
          message: `Theme "${themeName}" saved successfully`,
        });
        await fetchThemes();
        onThemeSave?.(savedTheme);
      } else {
        throw new Error("Failed to save theme");
      }
    } catch (error) {
      console.error("Error saving theme:", error);
      setNotification({
        type: "error",
        message: "Failed to save theme",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTheme = async (themeId: string) => {
    if (!confirm("Delete this theme?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/themes/${configId}?themeId=${themeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Theme deleted",
        });
        await fetchThemes();
        setSelectedTheme(null);
      } else {
        throw new Error("Failed to delete theme");
      }
    } catch (error) {
      console.error("Error deleting theme:", error);
      setNotification({
        type: "error",
        message: "Failed to delete theme",
      });
    } finally {
      setLoading(false);
    }
  };

  const newTheme = () => {
    setSelectedTheme(null);
    setColors(DEFAULT_COLORS);
    setThemeName(`Theme ${themes.length + 1}`);
  };

  if (loading && themes.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold mb-4">Theme Editor</h2>

        {/* Theme Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Existing Themes
          </label>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <div key={theme.id} className="flex items-center gap-2">
                <button
                  onClick={() => selectTheme(theme)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTheme?.id === theme.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {theme.name}
                </button>
                {selectedTheme?.id === theme.id && (
                  <button
                    onClick={() => deleteTheme(theme.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={newTheme}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Theme
            </button>
          </div>
        </div>

        {/* Theme Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme Name
          </label>
          <input
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Color Swatches */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Colors
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-2 capitalize">
                  {key}
                </label>
                <ColorSwatch
                  color={value}
                  onChange={(newColor) =>
                    handleColorChange(key as keyof ThemeColors, newColor)
                  }
                  label={key}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-3">Preview</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(colors).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-2"
                style={{
                  backgroundColor:
                    key === "background" ? value : "transparent",
                }}
              >
                <div
                  className="w-12 h-12 rounded border border-gray-300"
                  style={{ backgroundColor: value }}
                />
                <div className="text-xs">
                  <p className="font-medium">{key}</p>
                  <p className="text-gray-600">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveTheme}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Theme
        </button>
      </div>
    </div>
  );
}

function generateCSSVariables(colors: ThemeColors): Record<string, string> {
  return {
    "--color-primary": colors.primary,
    "--color-secondary": colors.secondary,
    "--color-accent": colors.accent,
    "--color-success": colors.success,
    "--color-error": colors.error,
    "--color-warning": colors.warning,
    "--color-info": colors.info,
    "--color-background": colors.background,
    "--color-text": colors.text,
  };
}
