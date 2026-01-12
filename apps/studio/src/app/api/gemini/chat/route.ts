/**
 * AI Chat API Route
 * Handles Gemini-powered conversations for code generation and feature scaffolding
 */

import { NextRequest, NextResponse } from "next/server";
import { getGeminiAI, saveAIChat } from "@/lib/gemini-ai";

export async function POST(request: NextRequest) {
  try {
    const { configId, messages, type } = await request.json();

    if (!configId || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing configId or messages" },
        { status: 400 }
      );
    }

    const ai = getGeminiAI();
    const response = { content: "", type };

    // Stream response
    try {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of ai.streamChat(messages)) {
              response.content += chunk;
              controller.enqueue(chunk);
            }

            // Save chat session
            await saveAIChat(configId, [
              ...messages,
              { role: "assistant", content: response.content },
            ]);

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
      console.error("Stream error:", error);
      // Fallback to non-streaming response
      return NextResponse.json({
        content: response.content || "Error generating response",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
