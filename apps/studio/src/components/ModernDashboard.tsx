"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Layout,
  Zap,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { LoadingSpinner } from "./UIComponents";

interface DashboardStats {
  totalComponents: number;
  totalContacts: number;
  totalThemes: number;
  totalMessages: number;
  recentActivity: Array<{
    id: string;
    title: string;
    type: string;
    timestamp: Date;
  }>;
}

interface ModernDashboardProps {
  configId: string;
}

export function ModernDashboard({ configId }: ModernDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [configId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/${configId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p>Failed to load dashboard</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Components",
      value: stats.totalComponents,
      icon: Layout,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      trend: "+12%",
    },
    {
      title: "Team Members",
      value: stats.totalContacts,
      icon: Users,
      color: "bg-green-50 text-green-600 border-green-200",
      trend: "+5%",
    },
    {
      title: "Design Themes",
      value: stats.totalThemes,
      icon: Zap,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      trend: "+8%",
    },
    {
      title: "Messages",
      value: stats.totalMessages,
      icon: BarChart3,
      color: "bg-orange-50 text-orange-600 border-orange-200",
      trend: "+23%",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Studio Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening in your studio.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`${card.color} border rounded-lg p-6 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8" />
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {card.trend}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Recent Activity
              </h2>
            </div>

            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <p className="text-gray-600 text-sm py-4">
                  No recent activity yet
                </p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {activity.type}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg border border-blue-400 p-6 text-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Tips
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="text-blue-200">✓</span>
                <span>
                  Use the AI Chat to generate components and features
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-200">✓</span>
                <span>
                  Build custom themes with the Design Builder
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-200">✓</span>
                <span>
                  Drag and drop components on the Canvas
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-200">✓</span>
                <span>
                  Track team activity in Timeline
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Navigation Tiles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Studio Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "AI Chat",
                description: "Generate code with AI",
                icon: Zap,
                color: "text-blue-600",
              },
              {
                title: "Design Builder",
                description: "Create themes & assets",
                icon: Layout,
                color: "text-purple-600",
              },
              {
                title: "Canvas Builder",
                description: "Drag & drop interface",
                icon: BarChart3,
                color: "text-green-600",
              },
              {
                title: "Team & Messages",
                description: "Collaborate with team",
                icon: Users,
                color: "text-orange-600",
              },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                >
                  <Icon className={`w-6 h-6 ${tool.color} mb-2 group-hover:scale-110 transition-transform`} />
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              number: "24/7",
              label: "AI Support Available",
              icon: Zap,
            },
            {
              number: "∞",
              label: "Unlimited Components",
              icon: TrendingUp,
            },
            {
              number: "100%",
              label: "Free & Open",
              icon: CheckCircle,
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <Icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {stat.number}
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
