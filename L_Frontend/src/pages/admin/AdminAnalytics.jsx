import React, { useEffect, useMemo, useState } from 'react';
import {
  StatCard,
  Card,
  PageHeader,
  Alert,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer,
  PaymentSimulationNotice,
} from '../../components/ui.jsx';
import {
  TrendingUp,
  BarChart3,
  CalendarDays,
  CreditCard,
  Store,
} from 'lucide-react';
import { bookingApi, paymentApi, providerApi, useFetch } from '../../api.js';

function fmtAmount(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
}

function SimpleBarChart({ data, labels, label, barColor = 'bg-blue-600', formatValue }) {
  const max = Math.max(1, ...data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold text-slate-700">
          Peak: {formatValue ? formatValue(max) : max}
        </span>
      </div>

      <div className="flex items-end gap-2.5 sm:gap-4 h-36 pt-4 border-b border-slate-100">
        {data.map((v, i) => {
          const heightPercent = Math.round((v / max) * 100);
          const isLatest = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="w-full relative transition-all duration-300 rounded-t-md" style={{ height: `${heightPercent}%` }}>
                <div
                  className={`w-full h-full rounded-t-md transition-all ${barColor} ${
                    isLatest ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'
                  }`}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                  {formatValue ? formatValue(v) : v}
                </div>
              </div>
              <span className={`text-[11px] ${isLatest ? 'font-bold text-blue-700' : 'text-slate-400 font-medium'}`}>
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Fetches providers for the top-N providerIds ranked by successful payment
 * records — there is no backend "top providers" endpoint, so this ranks
 * GET /api/v1/payments/admin/all records client-side, then enriches
 * each with its real GET /api/v1/providers/{id} record.
 */
function useTopProviders(payments) {
  const [providers, setProviders] = useState({});
  const [providerError, setProviderError] = useState(null);

  const ranked = useMemo(() => {
    const totals = new Map();
    (payments ?? []).forEach((p) => {
      if (!p.providerId || p.status !== 'SUCCESS') return;
      const entry = totals.get(p.providerId) ?? { providerId: p.providerId, gmv: 0, count: 0 };
      entry.gmv += Number(p.amount) || 0;
      entry.count += 1;
      totals.set(p.providerId, entry);
    });
    return Array.from(totals.values())
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5);
  }, [payments]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = ranked.filter((r) => !(r.providerId in providers));
      if (missing.length === 0) return;
      setProviderError(null);
      try {
        const results = await Promise.all(missing.map((r) => providerApi.getById(r.providerId)));
        if (cancelled) return;
        setProviders((prev) => {
          const next = { ...prev };
          missing.forEach((r, idx) => {
            next[r.providerId] = results[idx];
          });
          return next;
        });
      } catch (error) {
        if (!cancelled) {
          setProviderError(error.message || 'Could not load provider analytics from the API Gateway.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ranked]);

  return {
    providers: ranked.map((r) => ({ ...r, provider: providers[r.providerId] })),
    error: providerError,
  };
}

export default function AdminAnalytics() {
  const { data: bookings, loading: bookingsLoading, error: bookingsError } = useFetch(() => bookingApi.getAll());
  const { data: payments, loading: paymentsLoading, error: paymentsError } = useFetch(() => paymentApi.getAllPayments());
  const { data: stats, loading: statsLoading, error: statsError } = useFetch(() => paymentApi.getPlatformStats());

  const loading = bookingsLoading || paymentsLoading;
  const allBookings = useMemo(() => bookings ?? [], [bookings]);
  const allPayments = useMemo(() => payments ?? [], [payments]);

  // Real monthly aggregation derived from each record's actual createdAt timestamp.
  const monthlyKeys = useMemo(() => {
    const keys = new Set();
    allBookings.forEach((b) => {
      const k = monthKey(b.createdAt);
      if (k) keys.add(k);
    });
    allPayments.forEach((p) => {
      const k = monthKey(p.createdAt);
      if (k) keys.add(k);
    });
    return Array.from(keys).sort().slice(-6);
  }, [allBookings, allPayments]);

  const bookingsByMonth = monthlyKeys.map(
    (k) => allBookings.filter((b) => monthKey(b.createdAt) === k).length
  );
  const gmvByMonth = monthlyKeys.map((k) =>
    allPayments
      .filter((p) => p.status === 'SUCCESS' && monthKey(p.createdAt) === k)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  );

  const { providers: topProviders, error: providersError } = useTopProviders(allPayments);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        subtitle="Booking and successful payment-service record totals."
      />

      <PaymentSimulationNotice />

      {(bookingsError || paymentsError || statsError || providersError) && (
        <Alert variant="danger" title="Failed to load analytics data">
          {bookingsError || paymentsError || statsError || providersError}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Recorded payment volume"
          value={statsLoading || !stats ? '...' : fmtAmount(stats.grossMarketplaceVolume)}
          change={`${stats?.totalTransactionsCount ?? 0} payment records`}
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          label="Total Bookings"
          value={loading ? '...' : String(allBookings.length)}
          change="All-time, from Booking Service"
          changeType="positive"
          icon={CalendarDays}
        />
        <StatCard
          label="Recorded platform commission"
          value={statsLoading || !stats ? '...' : fmtAmount(stats.totalPlatformCommission)}
          change="From Payment Service"
          changeType="neutral"
          icon={CreditCard}
        />
        <StatCard
          label="Storage Providers Seen"
          value={loading ? '...' : String(new Set(allPayments.filter((p) => p.status === 'SUCCESS').map((p) => p.providerId)).size)}
          change="Providers with a successful record"
          changeType="neutral"
          icon={Store}
        />
      </div>

      {/* Charts Grid */}
      {monthlyKeys.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Not enough data for a monthly trend yet"
          description="Monthly booking and GMV trends will appear once bookings and payments exist across more than one month."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header title="Monthly Booking Count" subtitle="Real bookings grouped by creation month" />
            <Card.Body>
              <SimpleBarChart
                data={bookingsByMonth}
                labels={monthlyKeys.map(monthLabel)}
                label="Booking Count (Volume)"
                barColor="bg-blue-600"
              />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Monthly recorded payment volume" subtitle="Successful payment-service records grouped by month" />
            <Card.Body>
              <SimpleBarChart
                data={gmvByMonth}
                labels={monthlyKeys.map(monthLabel)}
                label="GMV (INR)"
                barColor="bg-emerald-600"
                formatValue={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
            </Card.Body>
          </Card>
        </div>
      )}

      <Card>
        <Card.Header
          title="Providers by recorded payment volume"
          subtitle="Ranked from successful payment-service records"
        />
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Rank</TableHead>
                <TableHead>Storage Facility</TableHead>
                <TableHead>Successful records</TableHead>
                <TableHead className="text-right">Recorded amount</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {topProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState icon={Store} title="No successful payment records" />
                  </TableCell>
                </TableRow>
              ) : (
                topProviders.map((p, i) => (
                  <TableRow key={p.providerId}>
                    <TableCell>
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        #{i + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-slate-900">
                        {p.provider?.businessName || `Provider #${p.providerId}`}
                      </p>
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">{p.count}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{fmtAmount(p.gmv)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
}
