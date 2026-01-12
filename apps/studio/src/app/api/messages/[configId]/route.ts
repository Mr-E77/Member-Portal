/**
 * Messages API Route
 * Inbox and messaging system
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const { searchParams } = request.nextUrl;
    const contactId = searchParams.get("contactId");
    const unread = searchParams.get("unread") === "true";

    const where: any = { configId: params.configId };
    if (contactId) {
      where.OR = [
        { fromContactId: contactId },
        { toContactId: contactId },
      ];
    }
    if (unread) where.read = false;

    const messages = await db.studioMessage.findMany({
      where,
      include: {
        fromContact: true,
        toContact: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
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
    const { fromContactId, toContactId, subject, content, attachments } = body;

    const message = await db.studioMessage.create({
      data: {
        configId: params.configId,
        fromContactId,
        toContactId,
        subject,
        content,
        attachments,
      },
      include: {
        fromContact: true,
        toContact: true,
      },
    });

    return NextResponse.json(
      { success: true, data: message },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { configId: string; messageId: string } }
) {
  try {
    const body = await request.json();
    const { read, starred } = body;

    const message = await db.studioMessage.update({
      where: { id: params.messageId },
      data: {
        read: read ?? undefined,
        readAt: read ? new Date() : undefined,
        starred: starred ?? undefined,
      },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
