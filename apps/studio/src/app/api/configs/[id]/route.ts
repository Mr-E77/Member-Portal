import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const config = await prisma.portalConfigModel.findUnique({
      where: { id: params.id },
    });

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, preset, data } = body;

    const existing = await prisma.portalConfigModel.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    const normalizedSections = Array.isArray(data?.sections)
      ? data.sections
          .sort((a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0))
          .map((section: any, idx: number) => ({
            ...section,
            order: idx + 1,
          }))
      : undefined;

    const updated = await prisma.portalConfigModel.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        preset: preset ?? existing.preset,
        data: {
          ...(existing.data as Record<string, unknown>),
          ...(data ?? {}),
          id: params.id,
          ...(normalizedSections ? { sections: normalizedSections } : {}),
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
