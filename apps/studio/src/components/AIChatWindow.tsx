"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AIChat } from "./AIChat";

interface AIChatWindowProps {
  configId: string;
}

export function AIChatWindow({ configId }: AIChatWindowProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40"
        aria-label="Open AI Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 shadow-xl z-50 rounded-lg">
      <AIChat configId={configId} onClose={() => setIsOpen(false)} />
    </div>
  );
}
