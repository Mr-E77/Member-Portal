"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Star,
  Archive,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { LoadingSpinner, Notification } from "./UIComponents";

interface Message {
  id: string;
  configId: string;
  fromContactId: string;
  toContactId: string;
  content: string;
  read: boolean;
  starred: boolean;
  createdAt: Date;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface MessagingProps {
  configId: string;
  contacts: Contact[];
}

export function MessagingInterface({
  configId,
  contacts,
}: MessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [configId, selectedContactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedContactId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/messages/${configId}?contactId=${selectedContactId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContactId) return;

    try {
      const response = await fetch(`/api/messages/${configId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromContactId: "current-user",
          toContactId: selectedContactId,
          content: messageInput,
        }),
      });

      if (response.ok) {
        setMessageInput("");
        await fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNotification({
        type: "error",
        message: "Failed to send message",
      });
    }
  };

  const toggleStarred = async (messageId: string) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      await fetch(`/api/messages/${configId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          starred: !message.starred,
        }),
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, starred: !m.starred } : m
        )
      );
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${configId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          read: true,
        }),
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, read: true } : m
        )
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${configId}?messageId=${messageId}`, {
        method: "DELETE",
      });

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setNotification({
        type: "success",
        message: "Message deleted",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const filteredMessages = messages.filter((m) => {
    if (filter === "unread") return !m.read;
    if (filter === "starred") return m.starred;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-96 flex">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Contact List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">Inbox</h3>
          <div className="flex gap-2 text-xs">
            {(["all", "unread", "starred"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded capitalize ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-4 text-center text-gray-600 text-sm">
              No contacts yet
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                  selectedContactId === contact.id ? "bg-blue-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {contact.avatar && (
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {contact.email}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="w-2/3 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              {selectedContact.avatar && (
                <img
                  src={selectedContact.avatar}
                  alt={selectedContact.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {selectedContact.name}
                </p>
                <p className="text-xs text-gray-600">{selectedContact.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingSpinner size="md" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className="group p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onMouseEnter={() => !message.read && markAsRead(message.id)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          {message.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      {/* Message Actions */}
                      <div className="hidden group-hover:flex gap-1">
                        <button
                          onClick={() => toggleStarred(message.id)}
                          className={`p-1 rounded hover:bg-yellow-100 transition-colors ${
                            message.starred
                              ? "text-yellow-600"
                              : "text-gray-400"
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p className="text-sm">Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
