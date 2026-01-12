"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, FileText, Github, ExternalLink } from "lucide-react";

interface ThemeToggleProps {
  onThemeChange?: (theme: "light" | "dark") => void;
}

export function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("studioTheme") || "light";
    setIsDark(savedTheme === "dark");
    applyTheme(savedTheme === "dark");
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem("studioTheme", newIsDark ? "dark" : "light");
    applyTheme(newIsDark);
    onThemeChange?.(newIsDark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
}

interface DocumentationProps {
  configId: string;
}

export function Documentation({ configId }: DocumentationProps) {
  const [activeTab, setActiveTab] = useState("getting-started");

  const docs = {
    "getting-started": {
      title: "Getting Started",
      content: `
# Welcome to Portal Design Studio

## Quick Start

1. **Create a Configuration** - Start by creating a new portal configuration
2. **Use AI Chat** - Ask the AI to generate components and features
3. **Design Your Theme** - Customize colors and create multiple themes
4. **Build Your Canvas** - Drag and drop components to build your interface
5. **Manage Team** - Add contacts and collaborate with your team
6. **Export Code** - Generate and export your work as React components

## Key Features

- **AI-Powered Code Generation** - Generate React components using natural language
- **Drag-and-Drop Builder** - Intuitive visual interface for building layouts
- **Theme Management** - Create and manage multiple design themes
- **Team Collaboration** - Chat with team members and manage contacts
- **Timeline Tracking** - Keep track of all changes and milestones
- **Code Export** - Export your work in multiple formats
      `,
    },
    "ai-chat": {
      title: "AI Chat & Code Generation",
      content: `
# Using AI Chat

The AI Chat feature allows you to generate components and features using natural language.

## How to Use

1. Open the AI Chat window (bottom right corner)
2. Describe what you want to create:
   - "Create a card component with an image and description"
   - "Generate a form with name, email, and message fields"
   - "Build a navigation header with logo and menu"

## AI Capabilities

- **Component Generation** - Create React components from descriptions
- **Code Fixing** - Get suggestions to improve your code
- **Code Explanation** - Understand how React patterns work
- **Style Generation** - Generate TailwindCSS classes
- **Feature Scaffolding** - Create complete feature setups

## Tips for Best Results

- Be specific about what you want
- Mention libraries you prefer (React, TailwindCSS, etc)
- Ask for explanations if you don't understand the code
      `,
    },
    "design-system": {
      title: "Design System & Themes",
      content: `
# Design System & Themes

## Creating Themes

1. Go to **Design Builder**
2. Click **New Theme** to create a custom theme
3. Customize colors for:
   - Primary, Secondary, Accent colors
   - Success, Error, Warning, Info colors
   - Background and Text colors

## Managing Assets

Upload and organize images, videos, and icons:

1. Click **Upload** in Asset Manager
2. Select files from your computer
3. Organize by type (Image, Video, Icon)
4. Copy URLs to use in your components

## CSS Variables

Themes automatically generate CSS variables:
\`\`\`css
--color-primary: #3B82F6;
--color-secondary: #10B981;
--color-accent: #F59E0B;
/* ... more variables */
\`\`\`

Use these in your components for consistent styling.
      `,
    },
    "canvas-builder": {
      title: "Canvas Builder",
      content: `
# Canvas Builder Guide

## Building Your Interface

1. **Add Components** - Click component names on the left to add them
2. **Reorder** - Drag components to change their order
3. **Edit Properties** - Click settings icon to edit component props
4. **Duplicate** - Click copy to create duplicates
5. **Delete** - Remove unwanted components

## Component Properties

Each component has customizable properties:
- **Text** - Component content and labels
- **Styles** - Size, color, padding, etc
- **Behavior** - Click handlers, form validation
- **Accessibility** - ARIA labels and roles

## Exporting Your Canvas

After building your interface, export as:
- **React Component** - Use in your app
- **Configuration JSON** - Save and reload later
- **NPM Package** - Share with your team
      `,
    },
    "team-collab": {
      title: "Team & Collaboration",
      content: `
# Team Collaboration

## Managing Contacts

Add team members with different roles:

- **Admin** - Full access to all features
- **Editor** - Can edit designs and code
- **Member** - Can view and comment
- **Viewer** - Read-only access

## Team Messaging

Use the Messaging interface to:
- Chat with team members
- Share design feedback
- Discuss implementation details
- Stay in sync on decisions

## Activity Timeline

Track all changes with the Timeline:
- See who made what changes
- Track milestones and releases
- Document decisions and rationale
- Review project history
      `,
    },
    "resources": {
      title: "Resources & Help",
      content: `
# Resources & Help

## Official Documentation

- [React Documentation](https://react.dev)
- [TailwindCSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Community

- GitHub Issues for bug reports
- Discussion forums for questions
- Community components library
- Example projects

## Shortcuts

| Action | Shortcut |
|--------|----------|
| Send Message | Enter |
| Copy Code | Ctrl+C or Cmd+C |
| New Component | Ctrl+N or Cmd+N |

## Support

For issues and questions:
1. Check the FAQ section
2. Search existing issues
3. Create a new issue with details
4. Contact support team
      `,
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Documentation & Help
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {Object.entries(docs).map(([key, { title }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none mb-6">
        <div
          className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: docs[activeTab as keyof typeof docs].content
              .trim()
              .split("\n")
              .map((line) => {
                if (line.startsWith("# ")) {
                  return `<h2 class="text-2xl font-bold my-4">${line.substring(2)}</h2>`;
                }
                if (line.startsWith("## ")) {
                  return `<h3 class="text-xl font-semibold my-3">${line.substring(3)}</h3>`;
                }
                if (line.startsWith("- ")) {
                  return `<li class="ml-4">${line.substring(2)}</li>`;
                }
                if (line.startsWith("1. ")) {
                  return `<li class="ml-4">${line.substring(3)}</li>`;
                }
                if (line.startsWith("`")) {
                  return `<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">${line}</code>`;
                }
                return `<p class="my-2">${line}</p>`;
              })
              .join(""),
          }}
        />
      </div>

      {/* Help Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Github className="w-4 h-4" />
          GitHub Repository
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="#"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <FileText className="w-4 h-4" />
          Full Documentation
          <ExternalLink className="w-3 h-3" />
        </a>
        <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
          <span>Contact Support</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
