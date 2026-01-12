import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import { uploadAvatar, deleteAvatar } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

/**
 * POST /api/user/avatar
 * Upload user avatar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Delete old avatar if exists
    if (user.avatarUrl) {
      try {
        await deleteAvatar(user.id);
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
        // Continue with upload even if delete fails
      }
    }

    // Upload new avatar
    const urls = await uploadAvatar(buffer, user.id);

    // Update user record
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: urls.medium },
    });

    Sentry.addBreadcrumb({
      category: 'user',
      message: `User ${user.id} uploaded new avatar`,
      level: 'info',
    });

    return NextResponse.json({
      success: true,
      avatar: {
        url: urls.medium,
        thumbnail: urls.thumbnail,
        original: urls.original,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    Sentry.captureException(error, {
      tags: { context: 'avatar-upload-api' },
    });

    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/avatar
 * Delete user avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.avatarUrl) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 400 }
      );
    }

    // Delete from S3
    await deleteAvatar(user.id);

    // Update user record
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    });

    Sentry.addBreadcrumb({
      category: 'user',
      message: `User ${user.id} deleted avatar`,
      level: 'info',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    Sentry.captureException(error, {
      tags: { context: 'avatar-delete-api' },
    });

    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
