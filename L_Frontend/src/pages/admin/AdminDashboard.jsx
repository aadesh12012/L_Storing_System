import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StatCard,
  Card,
  StatusBadge,
  Button,
  PageHeader,
  Alert,
  EmptyState,
  PaymentSimulationNotice,
} from '../../components/ui.jsx';
import {
  ChevronRight,
  TrendingUp,
  Store,
  Users,
  CalendarDays,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { userApi, providerApi, bookingApi, paymentApi, useFetch } from '../../api.js';

function fmtAmount(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return val;
  }
}

/**
 * Every figure on this page comes from a real backend endpoint:
 *   - Platform stats: GET /api/v1/payments/admin/stats
 *   - Registered users: GET /api/v1/users
 *   - Pending KYC queue: GET /api/v1/providers/kyc/pending
 *   - Platform bookings: GET /api/v1/bookings
 * There is no admin "audit log" / activity-feed endpoint in any service, so
 * this page shows the most recent real bookings instead of fabricating one.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const stats = useFetch(() => paymentApi.getPlatformStats());
  const users = useFetch(() => userApi.listAllUsers());
  const pendingKyc = useFetch(() => providerApi.listPendingKyc());
  const bookings = useFetch(() => bookingApi.getAll());

  const loading = stats.loading || users.loading || pendingKyc.loading || bookings.loading;
  const anyError = stats.error || users.error || pendingKyc.error || bookings.error;

  const allBookings = bookings.data ?? [];
  const activeBookings = allBookings.filter((b) => b.status === 'ACTIVE').length;
  const recentBookings = [...allBookings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Control Center"
        subtitle="Real-time oversight of luggage storage marketplace operations and transactions."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" icon={ShieldCheck} onClick={() => navigate('/admin/kyc')}>
              Review provider approvals{pendingKyc.data ? ` (${pendingKyc.data.length})` : ''}
            </Button>
            <Button variant="primary" size="md" icon={TrendingUp} onClick={() => navigate('/admin/analytics')}>
              View Analytics
            </Button>
          </div>
        }
      />

      {anyError && (
        <Alert variant="danger" title="Some platform metrics failed to load">
          {anyError}
        </Alert>
      )}

      <PaymentSimulationNotice />

      {/* KPI Stats Grid — every value from a real backend response */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={loading ? '...' : String(allBookings.length)}
          change={`${activeBookings} currently active`}
          changeType="neutral"
          icon={CalendarDays}
        />
        <StatCard
          label="Recorded payment volume"
          value={loading || !stats.data ? '...' : fmtAmount(stats.data.grossMarketplaceVolume)}
          change={`${stats.data?.totalTransactionsCount ?? 0} payment records`}
          changeType="neutral"
          icon={CreditCard}
        />
        <StatCard
          label="Registered Users"
          value={loading || !users.data ? '...' : String(users.data.length)}
          change="From User Service"
          changeType="neutral"
          icon={Users}
        />
        <StatCard
          label="Recorded platform commission"
          value={loading || !stats.data ? '...' : fmtAmount(stats.data.totalPlatformCommission)}
          change="From Payment Service"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          label="Providers pending approval"
          value={loading || !pendingKyc.data ? '...' : `${pendingKyc.data.length} pending`}
          change={pendingKyc.data?.length ? 'Requires action' : 'Queue clear'}
          changeType={pendingKyc.data?.length ? 'negative' : 'positive'}
          icon={ShieldCheck}
        />
        <StatCard
          label="Payout records marked successful"
          value={loading || !stats.data ? '...' : fmtAmount(stats.data.totalProviderPayouts)}
          change="From Payment Service"
          changeType="neutral"
          icon={Store}
        />
        <StatCard
          label="Pending Provider Earnings"
          value={loading || !stats.data ? '...' : fmtAmount(stats.data.pendingProviderEarnings)}
          change="Recorded as pending payout"
          changeType="neutral"
          icon={AlertTriangle}
        />
        <StatCard
          label="Active Bookings Now"
          value={loading ? '...' : String(activeBookings)}
          change="Luggage currently in custody"
          changeType="positive"
          icon={CalendarDays}
        />
      </div>

      {/* Main Grid: Recent Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <Card.Header
              title="Most Recent Bookings"
              subtitle="Live feed from the Booking microservice (no admin audit-log endpoint exists yet)"
            >
              <Button variant="ghost" size="sm" icon={ChevronRight} onClick={() => navigate('/admin/bookings')}>
                All bookings
              </Button>
            </Card.Header>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading recent bookings...</div>
              ) : recentBookings.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No bookings recorded yet" />
              ) : (
                recentBookings.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        BK-{b.id} · User #{b.userId} → Provider #{b.providerId}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.luggageCount ?? 1} bag(s) · {fmtAmount(b.totalAmount ?? b.estimatedAmount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={b.status} />
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                        {fmtDate(b.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Priority Actions */}
        <div className="space-y-6">
          <Card>
            <Card.Header title="Pending Action Queue" subtitle="Tasks needing review" />
            <Card.Body className="space-y-3 p-5">
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">
                    {loading || !pendingKyc.data ? '...' : pendingKyc.data.length} provider profile(s)
                  </span>
                  {(pendingKyc.data?.length ?? 0) > 0 && (
                    <span className="text-[10px] font-semibold bg-amber-200/60 text-amber-800 px-1.5 py-0.5 rounded">
                      Needs Review
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Provider profiles awaiting approval.
                </p>
                <Button variant="primary" size="sm" className="mt-1" onClick={() => navigate('/admin/kyc')}>
                  Review Submissions <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Admin Controls" />
            <Card.Body className="space-y-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={Users}
                onClick={() => navigate('/admin/users')}
              >
                Manage User Accounts
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={Store}
                onClick={() => navigate('/admin/providers')}
              >
                Inspect Storage Provider Network
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={CalendarDays}
                onClick={() => navigate('/admin/bookings')}
              >
                Monitor All Live Platform Bookings
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
