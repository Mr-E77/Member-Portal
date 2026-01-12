import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { configId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where: any = { configId: params.configId };
    if (type) where.type = type;

    const assets = await prisma.studioAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { configId: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // In production, upload to S3 or similar storage
    // For now, create a data URL or use a placeholder
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type;
    const url = `data:${mimeType};base64,${base64}`;

    const assetType =
      file.type.startsWith("image") ? "image" :
      file.type.startsWith("video") ? "video" : "icon";

    const asset = await prisma.studioAsset.create({
      data: {
        id: `asset-${Date.now()}`,
        configId: params.configId,
        name: file.name,
        type: assetType,
        url,
        metadata: {
          size: file.size,
          type: file.type,
        },
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Error uploading asset:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { configId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID required" },
        { status: 400 }
      );
    }

    await prisma.studioAsset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
