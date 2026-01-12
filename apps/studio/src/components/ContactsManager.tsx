"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Mail, Phone } from "lucide-react";
import { Modal, Notification, LoadingSpinner } from "./UIComponents";

interface Contact {
  id: string;
  configId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactsManagerProps {
  configId: string;
}

export function ContactsManager({ configId }: ContactsManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member",
    phone: "",
    notes: "",
    avatar: "",
  });

  const roles = ["member", "editor", "admin", "viewer"];

  useEffect(() => {
    fetchContacts();
  }, [configId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contacts/${configId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setNotification({
        type: "error",
        message: "Failed to load contacts",
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email,
        role: contact.role,
        phone: contact.phone || "",
        notes: contact.notes || "",
        avatar: contact.avatar || "",
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: "",
        email: "",
        role: "member",
        phone: "",
        notes: "",
        avatar: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      setNotification({
        type: "error",
        message: "Name and email are required",
      });
      return;
    }

    try {
      setLoading(true);
      const method = editingContact ? "PUT" : "POST";
      const url = editingContact
        ? `/api/contacts/${configId}?contactId=${editingContact.id}`
        : `/api/contacts/${configId}`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: editingContact
            ? "Contact updated successfully"
            : "Contact added successfully",
        });
        setShowModal(false);
        await fetchContacts();
      } else {
        throw new Error("Failed to save contact");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      setNotification({
        type: "error",
        message: "Failed to save contact",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm("Delete this contact?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/contacts/${configId}?contactId=${contactId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Contact deleted",
        });
        await fetchContacts();
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      setNotification({
        type: "error",
        message: "Failed to delete contact",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && contacts.length === 0) {
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Contacts & Team</h2>
        <button
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>No contacts yet. Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {/* Avatar */}
              {contact.avatar && (
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full mb-3 object-cover"
                />
              )}

              {/* Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {contact.name}
              </h3>

              {/* Role */}
              <p className="text-sm inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mb-3">
                {contact.role}
              </p>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${contact.phone}`} className="text-blue-600">
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <p className="text-xs text-gray-600 italic mb-4 line-clamp-2">
                  "{contact.notes}"
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(contact)}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          title={editingContact ? "Edit Contact" : "Add Contact"}
          onClose={() => setShowModal(false)}
          actionLabel={editingContact ? "Update" : "Add"}
          onAction={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
