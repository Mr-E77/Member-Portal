"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  code?: string;
}

interface AIChatProps {
  configId: string;
  onClose?: () => void;
}

export function AIChat({ configId, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "👋 Hello! I'm your AI assistant. I can help you:\n\n- **Generate React Components** - Describe what you need\n- **Scaffold Features** - Create complete feature setups\n- **Fix Code** - Review and improve your code\n- **Explain Code** - Learn about React patterns\n- **Generate Styles** - Create TailwindCSS designs\n\nWhat would you like to build?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`/api/gemini/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId,
          messages: messages
            .concat(userMessage)
            .map((m) => ({ role: m.role, content: m.content })),
          type: "general",
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let content = "";
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        content += text;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = content;
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again or check your API configuration.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string, messageId: string) => {
    navigator.clipboard.writeText(code);
    setCopied(messageId);
    setTimeout(() => setCopied(null), 2000);
  };

  const extractCode = (content: string) => {
    const match = content.match(/```(?:tsx|ts|jsx|js)?\n([\s\S]*?)\n```/);
    return match ? match[1] : null;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">AI Code Assistant</h3>
          <p className="text-sm text-blue-100">Powered by Gemini</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-md lg:max-w-lg ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-lg rounded-tr-none"
                  : "bg-gray-100 text-gray-900 rounded-lg rounded-tl-none"
              } p-4`}
            >
              <div className="text-sm leading-relaxed">
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {message.content}
                </ReactMarkdown>
              </div>

              {/* Code Block */}
              {message.role === "assistant" && (
                <>
                  {extractCode(message.content) && (
                    <div className="mt-3 bg-gray-900 rounded p-3 overflow-x-auto">
                      <pre className="text-gray-100 text-xs font-mono">
                        <code>
                          {extractCode(message.content)?.substring(0, 300)}...
                        </code>
                      </pre>
                      <button
                        onClick={() => {
                          const code = extractCode(message.content);
                          if (code)
                            handleCopyCode(code, message.id);
                        }}
                        className="mt-2 flex items-center gap-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-100 px-2 py-1 rounded transition-colors"
                      >
                        {copied === message.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              <p className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg rounded-tl-none p-4">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-4 bg-gray-50"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to generate a component, fix code, explain patterns..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
