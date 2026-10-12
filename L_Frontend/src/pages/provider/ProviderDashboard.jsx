import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StatCard,
  Card,
  StatusBadge,
  Button,
  PageHeader,
  Alert,
  EmptyState,
} from '../../components/ui.jsx';
import {
  Store,
  CalendarDays,
  CreditCard,
  Star,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Luggage,
  RefreshCw,
} from 'lucide-react';
import { bookingApi, paymentApi, useFetch } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { providerId, providerProfile } = useAuth();
  const [actionNotice, setActionNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useFetch(() => bookingApi.getByProvider(providerId), [providerId]);

  const {
    data: earnings,
    loading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useFetch(() => paymentApi.getEarnings(providerId), [providerId]);

  const all = bookings || [];
  const pending = all.filter((b) => b.status === 'REQUESTED' || b.status === 'PENDING_APPROVAL');
  const active = all.filter((b) => b.status === 'ACTIVE');

  function refetchAll() {
    refetchBookings();
    refetchEarnings();
  }

  async function handleApprove(id) {
    setActionError(null);
    try {
      await bookingApi.approve(id, providerId);
      setActionNotice(`Booking #${id} approved in database.`);
      setTimeout(() => setActionNotice(null), 3000);
      refetchBookings();
    } catch (err) {
      setActionError(err.message || 'Could not approve the booking through the API Gateway.');
    }
  }

  async function handleDecline(id) {
    setActionError(null);
    try {
      await bookingApi.decline(id, providerId, 'Storage capacity full');
      setActionNotice(`Booking #${id} declined.`);
      setTimeout(() => setActionNotice(null), 3000);
      refetchBookings();
    } catch (err) {
      setActionError(err.message || 'Could not decline the booking through the API Gateway.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage Hub Dashboard"
        subtitle={`Live operations for ${providerProfile?.businessName || `Provider #${providerId}`} from Provider & Booking microservices.`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetchAll}>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Store}
              onClick={() => navigate('/provider/listings')}
            >
              Manage Hub Locations
            </Button>
          </div>
        }
      />

      {actionError && <Alert variant="danger" title="Booking action failed">{actionError}</Alert>}

      {actionNotice && (
        <Alert variant="success" title="State Updated">
          {actionNotice}
        </Alert>
      )}

      {bookingsError && (
        <Alert variant="danger" title="API Gateway Notice">
          {bookingsError}
        </Alert>
      )}

      {earningsError && (
        <Alert variant="danger" title="Earnings could not be loaded">
          {earningsError}
        </Alert>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Requests"
          value={bookingsLoading ? '...' : String(pending.length)}
          change={pending.length > 0 ? 'Awaiting response' : 'Queue clear'}
          changeType={pending.length > 0 ? 'negative' : 'positive'}
          icon={Clock}
        />
        <StatCard
          label="Active Stored Luggage"
          value={bookingsLoading ? '...' : `${active.length} Session(s)`}
          change="Currently in physical custody"
          changeType="positive"
          icon={Luggage}
        />
        <StatCard
          label="Total Gross Earnings"
          value={
            earningsLoading || !earnings
              ? '...'
              : `₹${Number(earnings.totalGrossEarnings || 0).toLocaleString('en-IN')}`
          }
          change="From Payment microservice"
          changeType="positive"
          icon={CreditCard}
        />
        <StatCard
          label="Available Balance"
          value={
            earningsLoading || !earnings
              ? '...'
              : `₹${Number(earnings.availablePayoutBalance || 0).toLocaleString('en-IN')}`
          }
          change="Ready to withdraw"
          changeType="positive"
          icon={Star}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header
              title="Pending Booking Requests"
              subtitle="Incoming traveller storage requests awaiting your confirmation"
            >
              <Button
                variant="ghost"
                size="sm"
                icon={ChevronRight}
                onClick={() => navigate('/provider/bookings')}
              >
                All Bookings
              </Button>
            </Card.Header>
            <Card.Body className="space-y-3 p-5">
              {bookingsLoading ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Querying API Gateway for pending requests...
                </div>
              ) : pending.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No pending requests in the database right now.
                </div>
              ) : (
                pending.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          User #{b.userId}
                        </span>
                        <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          BK-{b.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {b.luggageCount || b.items?.length || 1} Bag(s) · Expected rate ₹{b.hourlyRate}/hr
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={XCircle}
                        onClick={() => handleDecline(b.id)}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handleApprove(b.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Active Custody List */}
          <Card>
            <Card.Header
              title="Active Luggage Custody"
              subtitle="Luggage checked in and currently occupying capacity"
            />
            <Card.Body className="p-5 space-y-3">
              {active.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No bags currently checked in.
                </div>
              ) : (
                active.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {b.luggageCount || b.items?.length || 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Booking BK-{b.id}</p>
                        <p className="text-slate-400">User #{b.userId} · Rate: ₹{b.hourlyRate}/hr</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => navigate('/provider/bookings')}
                    >
                      Inspect / Check Out
                    </Button>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Right Column: Shortcuts */}
        <div className="space-y-6">
          <Card>
            <Card.Header title="Provider Actions" subtitle="Microservice shortcuts" />
            <Card.Body className="space-y-2.5">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={CalendarDays}
                onClick={() => navigate('/provider/bookings')}
              >
                Inspect All Custody Bookings
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={CreditCard}
                onClick={() => navigate('/provider/earnings')}
              >
                Payout Records (Simulation)
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={Store}
                onClick={() => navigate('/provider/listings')}
              >
                Register Storage Locations
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
