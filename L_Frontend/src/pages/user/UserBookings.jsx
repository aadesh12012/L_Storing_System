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
  CalendarDays,
  Search,
  RefreshCw,
  Clock,
  MapPin,
  XCircle,
  Luggage,
  Eye,
} from 'lucide-react';
import { bookingApi, auth, useFetch } from '../../api.js';

function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return val;
  }
}

export default function UserBookings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [actionNotice, setActionNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const userId = auth.userId();

  const { data: bookings, loading, error, refetch } = useFetch(
    () => bookingApi.getByUser(userId),
    [userId]
  );

  const all = bookings || [];

  const filtered = all.filter((b) => {
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchSearch =
      String(b.id).includes(search) ||
      String(b.providerId).includes(search) ||
      String(b.locationId).includes(search);
    return matchStatus && matchSearch;
  });

  async function handleCancel() {
    if (!selectedBooking) return;
    setSaving(true);
    setActionError(null);
    try {
      await bookingApi.cancel(selectedBooking.id, userId, cancelReason, false);
      setActionNotice(`Booking #${selectedBooking.id} cancelled successfully.`);
      await refetch();
      setCancelModalOpen(false);
      setSelectedBooking(null);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Could not cancel the booking through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bookings"
        subtitle={`Live booking lifecycle records for User #${userId} from Booking microservice.`}
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {actionError && <Alert variant="danger" title="Booking cancellation failed">{actionError}</Alert>}

      {actionNotice && (
        <Alert variant="success" title="State Machine Updated">
          {actionNotice}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="API Gateway Notice">
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <FilterBar>
          <div className="flex-1 min-w-[240px]">
            <Input
              id="booking-search"
              placeholder="Search by booking ID or provider ID"
              leftIcon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              id="booking-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active (In Custody)</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAID">Paid</option>
              <option value="DECLINED">Declined</option>
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
                <TableHead>Booking Ref</TableHead>
                <TableHead>Provider / Hub</TableHead>
                <TableHead>Luggage Count</TableHead>
                <TableHead>Expected Drop-Off</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Lifecycle Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Loading bookings from API Gateway...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={Luggage}
                      title="No bookings recorded for this account"
                      description="Create a booking through 'Find Storage' to begin using the service."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => {
                  const canCancel =
                    b.status === 'REQUESTED' ||
                    b.status === 'PENDING_APPROVAL' ||
                    b.status === 'APPROVED';

                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                          BK-{b.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-900">
                          Provider #{b.providerId}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Hub Location #{b.locationId}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-700 font-medium">
                          {b.luggageCount || b.items?.length || 1} Bag(s)
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {fmtDate(b.expectedDropOffTime || b.createdAt)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        ₹{b.totalAmount ?? b.estimatedAmount ?? (b.hourlyRate ? b.hourlyRate * 3 : 0)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => setSelectedBooking(b)}
                          >
                            Details
                          </Button>
                          {canCancel && (
                            <Button
                              variant="danger-subtle"
                              size="sm"
                              icon={XCircle}
                              onClick={() => {
                                setSelectedBooking(b);
                                setCancelModalOpen(true);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Booking Details Modal */}
      {selectedBooking && !cancelModalOpen && (
        <Modal
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Details — BK-${selectedBooking.id}`}
          description="Direct state machine record from Booking microservice."
          footer={
            <Button variant="secondary" size="md" onClick={() => setSelectedBooking(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lifecycle State</span>
              <StatusBadge status={selectedBooking.status} />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <InfoRow label="Booking Database ID" value={String(selectedBooking.id)} />
              <InfoRow label="User ID" value={String(selectedBooking.userId)} />
              <InfoRow label="Provider ID" value={String(selectedBooking.providerId)} />
              <InfoRow label="Storage Location ID" value={String(selectedBooking.locationId)} />
              <InfoRow label="Hourly Rate" value={`₹${selectedBooking.hourlyRate}/hr`} />
              <InfoRow label="Expected Drop-off" value={fmtDate(selectedBooking.expectedDropOffTime)} />
              <InfoRow label="Expected Pickup" value={fmtDate(selectedBooking.expectedPickupTime)} />
              {selectedBooking.actualDropOffTime && (
                <InfoRow label="Actual Check-in" value={fmtDate(selectedBooking.actualDropOffTime)} />
              )}
              {selectedBooking.actualPickupTime && (
                <InfoRow label="Actual Check-out" value={fmtDate(selectedBooking.actualPickupTime)} />
              )}
              {selectedBooking.cancellationReason && (
                <InfoRow label="Cancellation Reason" value={selectedBooking.cancellationReason} />
              )}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">Total Billed</span>
                <span className="font-bold text-base text-blue-700">
                  ₹{selectedBooking.totalAmount ?? selectedBooking.estimatedAmount ?? 0}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {selectedBooking && cancelModalOpen && (
        <Modal
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title="Confirm Booking Cancellation"
          description="Cancel this booking in the backend state machine."
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setCancelModalOpen(false)} disabled={saving}>
                Keep Reservation
              </Button>
              <Button variant="danger" size="md" onClick={handleCancel} loading={saving}>
                Confirm Cancellation
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Alert variant="warning" title="Cancellation Policy">
              Cancellation is permitted before physical luggage drop-off.
            </Alert>

            <div>
              <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason for cancellation
              </label>
              <Select
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Alternative storage found">Alternative storage found</option>
                <option value="Flight / train reschedule">Flight / train reschedule</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
