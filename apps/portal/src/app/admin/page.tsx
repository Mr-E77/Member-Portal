import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/');
  }

  // Check if user is admin
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  if (!adminEmails.includes(session.user.email)) {
    redirect('/dashboard');
  }

  // Fetch stats
  const statsResponse = await fetch(
    `${process.env.NEXTAUTH_URL}/api/admin/stats`,
    {
      headers: {
        cookie: '', // Session cookie will be included automatically
      },
      cache: 'no-store',
    }
  );

  const stats = statsResponse.ok ? await statsResponse.json() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
          <p className="text-gray-600">
            Monitor users, subscriptions, and revenue.
          </p>
        </div>

        {stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
                <p className="text-green-600 text-sm mt-2">
                  +{stats.newUsers} this month
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.activeSubscriptions}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats.monthlyRevenue}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-sm mb-2">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers > 0
                    ? Math.round(
                        (stats.activeSubscriptions / stats.totalUsers) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* Users by Tier */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Users by Tier</h3>
              <div className="space-y-4">
                {stats.usersByTier.map((item: any) => (
                  <div key={item.tier} className="flex items-center justify-between">
                    <span className="capitalize text-gray-700">
                      {item.tier.replace('tier', 'Tier ')}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-64 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(item.count / stats.totalUsers) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-600 font-medium w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Management */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">User Management</h3>
                <Link
                  href="/admin/users"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Users →
                </Link>
              </div>
              <p className="text-gray-600">
                Manage users, view subscription details, and track activity.
              </p>
            </div>
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Failed to load statistics.</p>
          </div>
        )}
      </main>
    </div>
  );
}
