/**
 * Themes API Route
 * Manage color themes and design tokens
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const themes = await db.studioTheme.findMany({
      where: { configId: params.configId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: themes });
  } catch (error) {
    console.error("Failed to fetch themes:", error);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
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
    const {
      name,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      borderColor,
      variables,
    } = body;

    const theme = await db.studioTheme.create({
      data: {
        configId: params.configId,
        name,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        borderColor,
        variables,
      },
    });

    return NextResponse.json(
      { success: true, data: theme },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create theme:", error);
    return NextResponse.json(
      { error: "Failed to create theme" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { configId: string; themeId: string } }
) {
  try {
    const body = await request.json();

    const theme = await db.studioTheme.update({
      where: { id: params.themeId },
      data: body,
    });

    return NextResponse.json({ success: true, data: theme });
  } catch (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { configId: string; themeId: string } }
) {
  try {
    await db.studioTheme.delete({ where: { id: params.themeId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete theme:", error);
    return NextResponse.json(
      { error: "Failed to delete theme" },
      { status: 500 }
    );
  }
}
