/**
 * Contacts API Route
 * Team member and contact management
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const contacts = await db.studioContact.findMany({
      where: { configId: params.configId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
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
    const { firstName, lastName, email, phone, role, avatar, bio, notes } =
      body;

    const contact = await db.studioContact.create({
      data: {
        configId: params.configId,
        firstName,
        lastName,
        email,
        phone,
        role,
        avatar,
        bio,
        notes,
      },
    });

    return NextResponse.json(
      { success: true, data: contact },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { configId: string; contactId: string } }
) {
  try {
    const body = await request.json();

    const contact = await db.studioContact.update({
      where: { id: params.contactId },
      data: body,
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (error) {
    console.error("Failed to update contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { configId: string; contactId: string } }
) {
  try {
    await db.studioContact.delete({ where: { id: params.contactId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
