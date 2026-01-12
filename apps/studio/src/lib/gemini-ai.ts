/**
 * Gemini AI Integration for Code Generation & Feature Scaffolding
 * Powered by Google's Generative AI
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";

interface AIRequest {
  configId: string;
  prompt: string;
  context?: string;
  type: "component" | "feature" | "fix" | "explain" | "scaffold";
}

interface AIResponse {
  content: string;
  code?: string;
  componentName?: string;
  language?: string;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

class GeminiAI {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Generate React component code from description
   */
  async generateComponent(
    description: string,
    context?: string
  ): Promise<AIResponse> {
    const prompt = `
Generate a modern React component based on this description:

Description: ${description}

${context ? `\nContext: ${context}` : ""}

Requirements:
- Use React hooks (useState, useEffect)
- Include TypeScript types
- Use TailwindCSS for styling (v4)
- Make it reusable with props
- Include JSDoc comments
- Follow best practices

Format your response as:
\`\`\`tsx
// Component code here
\`\`\`

Then provide a brief explanation.
`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    return this.parseComponentResponse(text, description);
  }

  /**
   * Generate feature scaffolding (multiple components, API routes, types)
   */
  async scaffoldFeature(
    featureName: string,
    requirements: string[]
  ): Promise<AIResponse> {
    const prompt = `
Generate a complete feature scaffold for a Next.js app.

Feature: ${featureName}
Requirements:
${requirements.map((r) => `- ${r}`).join("\n")}

Provide:
1. Main component (TypeScript/React)
2. Types definition
3. API route handler (if needed)
4. Hooks/utilities

Format each section clearly with:
\`\`\`tsx
// file: components/Feature.tsx
\`\`\`

Then provide implementation notes.
`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    return {
      content: text,
      type: "scaffold",
      metadata: { featureName, requirementCount: requirements.length },
    };
  }

  /**
   * Fix or improve existing code
   */
  async fixCode(
    code: string,
    issue: string
  ): Promise<AIResponse> {
    const prompt = `
Fix the following code issue:

Issue: ${issue}

Current Code:
\`\`\`tsx
${code}
\`\`\`

Provide:
1. Fixed code
2. Explanation of the fix
3. Suggestions for improvement

Format as:
\`\`\`tsx
// Fixed code
\`\`\`

Explanation: ...
`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    return this.parseCodeResponse(text);
  }

  /**
   * Explain code with educational focus
   */
  async explainCode(code: string): Promise<AIResponse> {
    const prompt = `
Explain this React/TypeScript code in detail for learning purposes:

\`\`\`tsx
${code}
\`\`\`

Provide:
1. What this code does
2. Key concepts used
3. Best practices applied
4. Potential improvements
`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    return {
      content: text,
      type: "explain",
    };
  }

  /**
   * Generate CSS/styling from description
   */
  async generateStyles(description: string): Promise<AIResponse> {
    const prompt = `
Generate TailwindCSS classes for: ${description}

Also provide:
1. Responsive design classes
2. Dark mode support
3. Hover/focus states
4. Animation suggestions (if applicable)

Return only valid TailwindCSS classes and explanations.
`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    return {
      content: text,
      type: "styling",
    };
  }

  /**
   * Stream response for real-time chat
   */
  async *streamChat(
    messages: Array<{ role: "user" | "assistant"; content: string }>
  ): AsyncGenerator<string> {
    const chatHistory = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const chat = this.model.startChat({
      history: chatHistory.slice(0, -1), // All but last (which is new user message)
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const response = await chat.sendMessageStream(
      messages[messages.length - 1].content
    );

    for await (const chunk of response.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  /**
   * Parse component generation response
   */
  private parseComponentResponse(
    text: string,
    description: string
  ): AIResponse {
    const codeMatch = text.match(/```tsx\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : "";

    // Extract component name from code
    const nameMatch = code.match(/function\s+(\w+)/);
    const componentName = nameMatch ? nameMatch[1] : "GeneratedComponent";

    return {
      content: text,
      code,
      componentName,
      language: "typescript",
      type: "component",
      metadata: {
        generatedFrom: description,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Parse code fix response
   */
  private parseCodeResponse(text: string): AIResponse {
    const codeMatch = text.match(/```(?:tsx|ts|jsx|js)\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : "";

    return {
      content: text,
      code,
      language: "typescript",
      type: "fix",
      metadata: {
        fixedAt: new Date().toISOString(),
      },
    };
  }
}

// Singleton instance
let geminiInstance: GeminiAI | null = null;

export function getGeminiAI(): GeminiAI {
  if (!geminiInstance) {
    geminiInstance = new GeminiAI();
  }
  return geminiInstance;
}

/**
 * Save AI generation to database
 */
export async function saveAIGeneration(
  configId: string,
  type: "component" | "feature",
  name: string,
  code: string,
  prompt: string
) {
  try {
    if (type === "component") {
      return await db.studioComponent.create({
        data: {
          configId,
          name,
          code,
          generatedFrom: prompt,
          generatedBy: "gemini",
          category: "generated",
          description: `Generated from: ${prompt.substring(0, 100)}...`,
        },
      });
    } else if (type === "feature") {
      return await db.studioFeature.create({
        data: {
          configId,
          name,
          description: prompt,
          componentCode: code,
          generatedBy: "gemini",
        },
      });
    }
  } catch (error) {
    console.error("Failed to save AI generation:", error);
    throw error;
  }
}

/**
 * Save AI chat session
 */
export async function saveAIChat(
  configId: string,
  messages: Array<{ role: string; content: string }>,
  title?: string
) {
  try {
    return await db.studioAIChat.create({
      data: {
        configId,
        title,
        messages: messages as any,
        generatedCount: messages.filter(
          (m) => m.role === "assistant"
        ).length,
      },
    });
  } catch (error) {
    console.error("Failed to save AI chat:", error);
    throw error;
  }
}

export type { AIRequest, AIResponse };
