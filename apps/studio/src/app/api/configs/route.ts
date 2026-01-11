// apps/studio/src/app/api/configs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const configs = await prisma.portalConfigModel.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch configs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, preset, data } = body;
    const id = `config-${Date.now()}`;

    const normalizedSections = Array.isArray(data?.sections)
      ? data.sections
          .sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0))
          .map((section: any, idx: number) => ({
            ...section,
            order: idx + 1,
          }))
      : [];

    const config = await prisma.portalConfigModel.create({
      data: {
        id,
        name,
        preset,
        data: {
          ...data,
          id,
          sections: normalizedSections,
        },
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 });
  }
}
