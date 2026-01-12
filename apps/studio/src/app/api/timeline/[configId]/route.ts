import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { configId: string } }
) {
  try {
    const events = await prisma.studioTimeline.findMany({
      where: { configId: params.configId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { configId: string } }
) {
  try {
    const body = await request.json();
    const { title, description, type, userName } = body;

    const event = await prisma.studioTimeline.create({
      data: {
        id: `timeline-${Date.now()}`,
        configId: params.configId,
        title,
        description,
        type,
        userName,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating timeline event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
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
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID required" },
        { status: 400 }
      );
    }

    await prisma.studioTimeline.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting timeline event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
