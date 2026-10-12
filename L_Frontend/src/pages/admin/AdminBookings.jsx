import React, { useState } from 'react';
import {
  Card,
  StatusBadge,
  Button,
  Modal,
  Alert,
  InfoRow,
  PageHeader,
  FilterBar,
  Input,
  Select,
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
  Search,
  MapPin,
  RefreshCw,
  Eye,
  AlertTriangle,
  CalendarDays,
  Luggage,
} from 'lucide-react';
import { bookingApi, auth, useFetch } from '../../api.js';

function fmtAmount(amount) {
  if (amount == null) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
}

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

export default function AdminBookings() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: bookings, loading, error, refetch } = useFetch(
    () => bookingApi.getAll(filter !== 'ALL' ? filter : undefined),
    [filter]
  );

  const all = bookings ?? [];

  const filtered = all.filter((b) => {
    const matchSearch =
      String(b.id).includes(search) ||
      String(b.userId ?? '').includes(search) ||
      String(b.providerId ?? '').includes(search) ||
      String(b.locationId ?? '').includes(search);
    return matchSearch;
  });

  async function handleForceCancel() {
    if (!selected) return;
    setSaving(true);
    setActionError(null);
    try {
      const adminId = auth.userId();
      await bookingApi.cancel(selected.id, adminId, 'Admin forced dispute cancellation', true);
      setNotice(`Booking #${selected.id} has been force cancelled.`);
      await refetch();
      setSelected(null);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Could not cancel the booking through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Platform Bookings"
        subtitle="Live tracking of luggage custody cycles across all cities and administrative intervention."
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {actionError && <Alert variant="danger" title="Booking update failed">{actionError}</Alert>}

      {notice && (
        <Alert variant="success" title="Booking Updated">
          {notice}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Error loading bookings">
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <FilterBar>
          <div className="flex-1 min-w-[240px]">
            <Input
              id="admin-booking-search"
              placeholder="Search by booking, user, provider, or location ID..."
              leftIcon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              id="admin-status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active (In Custody)</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </FilterBar>
      </Card>

      {/* Bookings Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Booking Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Storage Hub</TableHead>
                <TableHead>Luggage</TableHead>
                <TableHead>Drop-Off</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    Loading platform bookings...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={CalendarDays}
                      title="No bookings match filter"
                      description="No records found for the selected query."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => {
                  const code = `BK-${b.id}`;
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-900">User #{b.userId}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-900">Provider #{b.providerId}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          Location #{b.locationId}
                        </p>
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">
                        {b.luggageCount ?? 1} Bag{(b.luggageCount ?? 1) > 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {fmtDate(b.expectedDropOffTime || b.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {fmtAmount(b.totalAmount ?? b.estimatedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Eye}
                          onClick={() => setSelected(b)}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Intervention Modal */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Booking Oversight — BK-${selected.id}`}
          description="Detailed session telemetry and administrative dispute actions."
          footer={
            <>
              {selected.status !== 'CANCELLED' && selected.status !== 'PAID' && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleForceCancel}
                  loading={saving}
                >
                  Force Cancel Reservation
                </Button>
              )}
              <Button variant="secondary" size="md" onClick={() => setSelected(null)} disabled={saving}>
                Close
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Session Status
              </span>
              <StatusBadge status={selected.status} />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <InfoRow label="Customer" value={`User #${selected.userId}`} />
              <InfoRow label="Storage Facility" value={`Provider #${selected.providerId} · Location #${selected.locationId}`} />
              <InfoRow label="Custody Count" value={`${selected.luggageCount ?? 1} Bags`} />
              <InfoRow label="Expected Drop-off" value={fmtDate(selected.expectedDropOffTime)} />
              <InfoRow label="Expected Pickup" value={fmtDate(selected.expectedPickupTime)} />
              {selected.actualDropOffTime && (
                <InfoRow label="Actual Check-in" value={fmtDate(selected.actualDropOffTime)} />
              )}
              {selected.actualPickupTime && (
                <InfoRow label="Actual Check-out" value={fmtDate(selected.actualPickupTime)} />
              )}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">Total Charged</span>
                <span className="font-bold text-base text-blue-700">{fmtAmount(selected.totalAmount ?? selected.estimatedAmount)}</span>
              </div>
            </div>

            {(selected.status === 'ACTIVE' || selected.status === 'PENDING_APPROVAL') && (
              <Alert variant="warning" title="Administrative Force Cancellation">
                Cancelling will terminate this booking immediately in the state machine. If payment was authorized, issue an audit-logged refund from the Payments section.
              </Alert>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
