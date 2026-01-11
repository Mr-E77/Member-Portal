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

    const config = await prisma.portalConfigModel.create({
      data: {
        id: `config-${Date.now()}`,
        name,
        preset,
        data,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create config" }, { status: 500 });
  }
}
