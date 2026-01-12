import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

/**
 * GET /api/user/profile
 * Fetch user profile with caching
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `user:profile:${session.user.id}`;
    
    // Try to get from cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(
        { user: cached, cached: true },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Cache': 'HIT',
          },
        }
      );
    }

    // Fetch from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        membershipTier: true,
        stripeCustomerId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cache for 5 minutes
    cache.set(cacheKey, user, 300);

    return NextResponse.json(
      { user, cached: false },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
