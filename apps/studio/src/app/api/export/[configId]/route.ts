import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ExportRequest {
  format: "react" | "json" | "package";
}

export async function POST(
  request: Request,
  { params }: { params: { configId: string } }
) {
  try {
    const body = (await request.json()) as ExportRequest;
    const { format } = body;

    // Fetch all studio data
    const [components, themes, contacts] = await Promise.all([
      prisma.studioComponent.findMany({
        where: { configId: params.configId },
      }),
      prisma.studioTheme.findMany({
        where: { configId: params.configId },
      }),
      prisma.studioContact.findMany({
        where: { configId: params.configId },
      }),
    ]);

    let code = "";

    if (format === "react") {
      code = generateReactComponent(components, themes);
    } else if (format === "json") {
      code = generateJSON({ components, themes, contacts });
    } else if (format === "package") {
      code = generatePackageJson();
    }

    return NextResponse.json({ code, format });
  } catch (error) {
    console.error("Error exporting code:", error);
    return NextResponse.json(
      { error: "Failed to export code" },
      { status: 500 }
    );
  }
}

function generateReactComponent(
  components: any[],
  themes: any[]
): string {
  return `import React from 'react';

export interface StudioComponentProps {
  theme?: string;
  children?: React.ReactNode;
}

export const StudioComponent: React.FC<StudioComponentProps> = ({
  theme = 'default',
  children,
}) => {
  const themes = ${JSON.stringify(themes, null, 2)};
  const currentTheme = themes.find(t => t.name === theme);

  return (
    <div
      style={{
        '--color-primary': currentTheme?.colors?.primary || '#3B82F6',
        '--color-secondary': currentTheme?.colors?.secondary || '#10B981',
      } as React.CSSProperties}
      className="studio-component"
    >
      {children}
    </div>
  );
};

export default StudioComponent;
`;
}

function generateJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

function generatePackageJson(): string {
  return JSON.stringify(
    {
      name: "studio-export",
      version: "1.0.0",
      description: "Generated studio component",
      main: "index.js",
      scripts: {
        build: "tsc",
        test: "jest",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        typescript: "^5.0.0",
        "@types/react": "^19.0.0",
        "@types/node": "^20.0.0",
      },
    },
    null,
    2
  );
}
