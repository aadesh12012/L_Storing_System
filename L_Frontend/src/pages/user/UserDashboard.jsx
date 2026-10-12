import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StatCard,
  Card,
  StatusBadge,
  Button,
  PageHeader,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer,
  EmptyState,
} from '../../components/ui.jsx';
import {
  CalendarDays,
  CreditCard,
  MapPin,
  ChevronRight,
  Luggage,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { bookingApi, auth, useFetch } from '../../api.js';

function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return val;
  }
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const userId = auth.userId();

  const { data: bookings, loading, error, refetch } = useFetch(
    () => bookingApi.getByUser(userId),
    [userId]
  );

  const allBookings = bookings || [];
  const activeBooking = allBookings.find((b) => b.status === 'ACTIVE');
  const activeCount = allBookings.filter((b) => b.status === 'ACTIVE').length;
  const totalCount = allBookings.length;
  const totalSpent = allBookings
    .filter((b) => b.status === 'COMPLETED' || b.status === 'PAID')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || Number(b.estimatedAmount) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traveller Dashboard"
        subtitle={`Live overview of your luggage storage activity (User #${userId})`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={MapPin}
              onClick={() => navigate('/user/search')}
            >
              Find Storage Nearby
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="danger" title="API Gateway Notice">
          {error}
        </Alert>
      )}

      {/* KPI Cards calculated from real backend data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Custody"
          value={loading ? '...' : `${activeCount} Session${activeCount === 1 ? '' : 's'}`}
          change={activeBooking ? `BK-${activeBooking.id} in custody` : 'No active storage'}
          changeType={activeBooking ? 'positive' : 'neutral'}
          icon={Luggage}
        />
        <StatCard
          label="Total Bookings"
          value={loading ? '...' : String(totalCount)}
          change="Recorded via Booking Service"
          changeType="neutral"
          icon={CalendarDays}
        />
        <StatCard
          label="Completed booking total"
          value={loading ? '...' : `₹${totalSpent.toLocaleString('en-IN')}`}
          change="From Booking Service amounts"
          changeType="neutral"
          icon={CreditCard}
        />
        <StatCard
          label="Account Status"
          value={auth.user()?.isActive === false ? 'Suspended' : 'Active'}
          change={auth.user()?.isActive === false ? 'Account inactive' : 'Account status'}
          changeType="neutral"
          icon={Clock}
        />
      </div>

      {/* Main Grid: Recent Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent bookings table (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header
              title="Recent Storage Sessions"
              subtitle="Data fetched live via API Gateway from Booking microservice"
            >
              <Button
                variant="ghost"
                size="sm"
                icon={ChevronRight}
                onClick={() => navigate('/user/bookings')}
              >
                View all
              </Button>
            </Card.Header>

            <TableContainer>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Booking Code</TableHead>
                    <TableHead>Location / Provider</TableHead>
                    <TableHead>Luggage Count</TableHead>
                    <TableHead>Drop-Off</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                        Loading bookings from the API Gateway...
                      </TableCell>
                    </TableRow>
                  ) : allBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={Luggage}
                          title="No storage bookings recorded"
                          description="You have not created any bookings in the database yet. Use 'Find Storage Nearby' to reserve your first slot."
                          action={
                            <Button
                              variant="primary"
                              size="sm"
                              icon={MapPin}
                              onClick={() => navigate('/user/search')}
                            >
                              Browse Storage Locations
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    allBookings.slice(0, 5).map((b) => (
                      <TableRow
                        key={b.id}
                        onClick={() => navigate('/user/bookings')}
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            BK-{b.id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-slate-900">
                            Provider #{b.providerId} · Hub #{b.locationId}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-700">
                            {b.luggageCount || b.items?.length || 1} Bag(s)
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {fmtDate(b.expectedDropOffTime || b.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          ₹{b.totalAmount ?? b.estimatedAmount ?? (b.hourlyRate ? b.hourlyRate * 3 : 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>

        {/* Quick Actions & Live Session */}
        <div className="space-y-6">
          {activeBooking ? (
            <Card className="border-blue-200 bg-white">
              <Card.Header
                title="Active Storage Custody"
                subtitle={`BK-${activeBooking.id} · Running session`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </Card.Header>
              <Card.Body className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Facility ID</span>
                  <span className="font-semibold text-slate-800">Hub #{activeBooking.locationId}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Luggage Items</span>
                  <span className="font-semibold text-slate-800">
                    {activeBooking.luggageCount || activeBooking.items?.length || 1} Bags
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Drop-off Time</span>
                  <span className="font-semibold text-slate-800">
                    {fmtDate(activeBooking.actualDropOffTime || activeBooking.expectedDropOffTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600 font-medium">Billed Rate</span>
                  <span className="text-base font-bold text-blue-700">
                    ₹{activeBooking.hourlyRate}/hr
                  </span>
                </div>
              </Card.Body>
              <Card.Footer>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/user/bookings')}
                >
                  Manage Session
                </Button>
              </Card.Footer>
            </Card>
          ) : (
            <Card>
              <Card.Header title="No Active Custody" subtitle="Bags are not currently stored" />
              <Card.Body className="text-xs text-slate-500 leading-relaxed">
                When you drop off luggage at a storage location, the current session and hourly cost estimate will display here.
              </Card.Body>
              <Card.Footer>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={MapPin}
                  onClick={() => navigate('/user/search')}
                >
                  Find Storage Near Me
                </Button>
              </Card.Footer>
            </Card>
          )}

          {/* Quick shortcuts */}
          <Card>
            <Card.Header title="Quick Actions" />
            <Card.Body className="space-y-2.5">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={MapPin}
                onClick={() => navigate('/user/search')}
              >
                Search Nearby Storage
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={CalendarDays}
                onClick={() => navigate('/user/bookings')}
              >
                View Booking History
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-start text-xs sm:text-sm"
                icon={CreditCard}
                onClick={() => navigate('/user/payments')}
              >
                Payment Records
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
