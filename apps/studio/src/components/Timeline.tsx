"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  User,
  Edit,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { LoadingSpinner, Notification } from "./UIComponents";

interface TimelineEvent {
  id: string;
  configId: string;
  title: string;
  description?: string;
  type: "milestone" | "update" | "feature" | "bug" | "release";
  userId?: string;
  userName?: string;
  changes?: Record<string, any>;
  createdAt: Date;
}

interface TimelineProps {
  configId: string;
}

const EVENT_TYPES = {
  milestone: { label: "Milestone", color: "bg-purple-100 text-purple-800" },
  update: { label: "Update", color: "bg-blue-100 text-blue-800" },
  feature: { label: "Feature", color: "bg-green-100 text-green-800" },
  bug: { label: "Bug Fix", color: "bg-red-100 text-red-800" },
  release: { label: "Release", color: "bg-yellow-100 text-yellow-800" },
};

export function Timeline({ configId }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<TimelineEvent["type"]>("update");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [configId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/timeline/${configId}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.sort((a: TimelineEvent, b: TimelineEvent) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
      setNotification({
        type: "error",
        message: "Failed to load timeline",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    if (!newEventTitle.trim()) {
      setNotification({
        type: "error",
        message: "Title is required",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/timeline/${configId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDesc,
          type: newEventType,
          userName: "Current User",
        }),
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Event added to timeline",
        });
        setNewEventTitle("");
        setNewEventDesc("");
        setNewEventType("update");
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error adding event:", error);
      setNotification({
        type: "error",
        message: "Failed to add event",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event?")) return;

    try {
      const response = await fetch(`/api/timeline/${configId}?eventId=${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Event deleted",
        });
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (loading && events.length === 0) {
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

      <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>

      {/* Add New Event */}
      <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-4">Add Event</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="What happened?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={newEventType}
                onChange={(e) =>
                  setNewEventType(e.target.value as TimelineEvent["type"])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newEventDesc}
              onChange={(e) => setNewEventDesc(e.target.value)}
              placeholder="Add more details..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={addEvent}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No timeline events yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200"></div>

          {/* Events */}
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative pl-20">
                {/* Timeline Dot */}
                <div
                  className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-white ${
                    EVENT_TYPES[event.type].color.split(" ")[0]
                  }`}
                ></div>

                {/* Event Card */}
                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            EVENT_TYPES[event.type].color
                          }`}
                        >
                          {EVENT_TYPES[event.type].label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-3 h-3" />
                        {new Date(event.createdAt).toLocaleDateString()} at{" "}
                        {new Date(event.createdAt).toLocaleTimeString()}
                      </div>

                      {event.userName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <User className="w-3 h-3" />
                          {event.userName}
                        </div>
                      )}

                      {event.description && (
                        <>
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === event.id ? null : event.id
                              )
                            }
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
                          >
                            {expandedId === event.id ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Show Details
                              </>
                            )}
                          </button>

                          {expandedId === event.id && (
                            <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {event.description}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
