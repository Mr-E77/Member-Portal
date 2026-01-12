import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { configId: string } }
) {
  try {
    const [components, contacts, themes, messages, timeline] = await Promise.all([
      prisma.studioComponent.count({ where: { configId: params.configId } }),
      prisma.studioContact.count({ where: { configId: params.configId } }),
      prisma.studioTheme.count({ where: { configId: params.configId } }),
      prisma.studioMessage.count({ where: { configId: params.configId } }),
      prisma.studioTimeline.findMany({
        where: { configId: params.configId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
        },
      }),
    ]);

    const stats = {
      totalComponents: components,
      totalContacts: contacts,
      totalThemes: themes,
      totalMessages: messages,
      recentActivity: timeline.map((event) => ({
        id: event.id,
        title: event.title,
        type: event.type,
        timestamp: event.createdAt,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
