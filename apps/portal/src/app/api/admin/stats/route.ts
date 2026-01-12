import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/stats
 * Get platform statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get counts by tier
    const usersByTier = await prisma.user.groupBy({
      by: ['membershipTier'],
      _count: true,
    });

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'active' },
    });

    // Get users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get revenue data (sum of active subscriptions)
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
      select: { stripePriceId: true },
    });

    // Map price IDs to amounts (you'd get these from Stripe in production)
    const priceMap: Record<string, number> = {
      [process.env.STRIPE_PRICE_TIER1 || '']: 0,
      [process.env.STRIPE_PRICE_TIER2 || '']: 10,
      [process.env.STRIPE_PRICE_TIER3 || '']: 25,
      [process.env.STRIPE_PRICE_TIER4 || '']: 50,
    };

    const monthlyRevenue = subscriptions.reduce(
      (sum, sub) => sum + (priceMap[sub.stripePriceId] || 0),
      0
    );

    return NextResponse.json(
      {
        totalUsers,
        activeSubscriptions,
        newUsers,
        monthlyRevenue,
        usersByTier: usersByTier.map((item) => ({
          tier: item.membershipTier,
          count: item._count,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
