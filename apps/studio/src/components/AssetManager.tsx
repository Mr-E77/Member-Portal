"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, Copy, Check } from "lucide-react";
import { Notification, LoadingSpinner } from "./UIComponents";

interface Asset {
  id: string;
  configId: string;
  name: string;
  type: "image" | "video" | "icon";
  url: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface AssetManagerProps {
  configId: string;
  onAssetSelect?: (asset: Asset) => void;
}

export function AssetManager({ configId, onAssetSelect }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video" | "icon">("all");

  useEffect(() => {
    fetchAssets();
  }, [configId]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assets/${configId}`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      setNotification({
        type: "error",
        message: "Failed to load assets",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    try {
      setUploading(true);
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("configId", configId);

        const response = await fetch(`/api/assets/${configId}`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
      }

      setNotification({
        type: "success",
        message: "Assets uploaded successfully",
      });
      await fetchAssets();
    } catch (error) {
      console.error("Error uploading assets:", error);
      setNotification({
        type: "error",
        message: "Failed to upload assets",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm("Delete this asset?")) return;

    try {
      const response = await fetch(`/api/assets/${configId}?assetId=${assetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Asset deleted",
        });
        await fetchAssets();
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      setNotification({
        type: "error",
        message: "Failed to delete asset",
      });
    }
  };

  const copyAssetUrl = (url: string, assetId: string) => {
    navigator.clipboard.writeText(url);
    setCopied(assetId);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredAssets = assets.filter(
    (asset) => selectedType === "all" || asset.type === selectedType
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <h2 className="text-2xl font-bold mb-6">Asset Manager</h2>

      {/* Upload Area */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
        <label className="cursor-pointer flex flex-col items-center gap-3">
          <Upload className="w-8 h-8 text-gray-600" />
          <div className="text-center">
            <p className="font-medium text-gray-700">
              {uploading ? "Uploading..." : "Drop files or click to upload"}
            </p>
            <p className="text-sm text-gray-600">
              Images, videos, and icons (max 10MB each)
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {(["all", "image", "video", "icon"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              selectedType === type
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>No assets found. Upload some to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Asset Preview */}
              <div className="bg-gray-100 h-48 flex items-center justify-center overflow-hidden">
                {asset.type === "image" ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : asset.type === "video" ? (
                  <video
                    src={asset.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl">🎨</div>
                )}
              </div>

              {/* Asset Info */}
              <div className="p-4">
                <p className="font-medium text-gray-900 truncate">
                  {asset.name}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Type: <span className="capitalize">{asset.type}</span>
                </p>

                {/* Asset URL */}
                <div className="mb-3 p-2 bg-gray-50 rounded text-xs break-all">
                  {asset.url}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => copyAssetUrl(asset.url, asset.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    {copied === asset.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
