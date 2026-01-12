/**
 * Components API Route
 * CRUD for generated and custom components
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const featured = searchParams.get("featured") === "true";

    const where: any = { configId: params.configId };
    if (category) where.category = category;
    if (featured) where.featured = true;

    const components = await db.studioComponent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: components });
  } catch (error) {
    console.error("Failed to fetch components:", error);
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const body = await request.json();
    const { name, code, category, description, generatedBy } = body;

    const component = await db.studioComponent.create({
      data: {
        configId: params.configId,
        name,
        code,
        category,
        description,
        generatedBy: generatedBy || "manual",
      },
    });

    return NextResponse.json(
      { success: true, data: component },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create component:", error);
    return NextResponse.json(
      { error: "Failed to create component" },
      { status: 500 }
    );
  }
}
