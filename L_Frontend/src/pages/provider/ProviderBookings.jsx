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
  RefreshCw,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  CalendarDays,
  Luggage,
} from 'lucide-react';
import { bookingApi, useFetch } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

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

export default function ProviderBookings() {
  const { providerId } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('Storage capacity full');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: bookings, loading, error, refetch } = useFetch(
    () => bookingApi.getByProvider(providerId),
    [providerId]
  );

  const all = bookings || [];

  const filtered = all.filter((b) => {
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchSearch =
      String(b.id).includes(search) ||
      String(b.userId).includes(search) ||
      String(b.locationId).includes(search);
    return matchStatus && matchSearch;
  });

  async function handleApprove(id) {
    setSaving(true);
    setActionError(null);
    try {
      await bookingApi.approve(id, providerId);
      setNotice(`Booking #${id} approved in database.`);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Could not approve the booking through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDecline() {
    if (!selectedBooking) return;
    setSaving(true);
    setActionError(null);
    try {
      await bookingApi.decline(selectedBooking.id, providerId, declineReason);
      setNotice(`Booking #${selectedBooking.id} declined in state machine.`);
      setDeclineModalOpen(false);
      setSelectedBooking(null);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Could not decline the booking through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckIn(id) {
    setSaving(true);
    setActionError(null);
    try {
      await bookingApi.checkIn(id, providerId);
      setNotice(`Booking #${id} checked in. Physical custody active.`);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Could not check in the booking through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckOut(id) {
    setSaving(true);
    setActionError(null);
    try {
      await bookingApi.checkOut(id, providerId);
      setNotice(`Booking #${id} checked out. Automatic billing triggered.`);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Could not check out the booking through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Luggage Custody & Check-Ins"
        subtitle={`Live operations for Provider #${providerId} via the API Gateway.`}
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {actionError && <Alert variant="danger" title="Booking action failed">{actionError}</Alert>}

      {notice && (
        <Alert variant="success" title="Status Updated in Database">
          {notice}
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
              id="provider-booking-search"
              placeholder="Search by booking ID or user ID..."
              leftIcon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              id="provider-booking-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved (Awaiting Drop)</option>
              <option value="ACTIVE">Active (In Custody)</option>
              <option value="COMPLETED">Completed</option>
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
                <TableHead>Booking Code</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Location Hub</TableHead>
                <TableHead>Luggage Count</TableHead>
                <TableHead>Drop-Off Timestamp</TableHead>
                <TableHead>Lifecycle State</TableHead>
                <TableHead className="text-right">Custody Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Querying API Gateway for provider bookings...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={Luggage}
                      title="No bookings recorded"
                      description="No incoming bookings found in the database for this provider."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        BK-{b.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-900">User #{b.userId}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600 text-xs">Hub #{b.locationId}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-700">
                        {b.luggageCount || b.items?.length || 1} Bag(s)
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {fmtDate(b.expectedDropOffTime || b.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(b.status === 'REQUESTED' || b.status === 'PENDING_APPROVAL') && (
                          <>
                            <Button
                              variant="secondary"
                              size="xs"
                              icon={XCircle}
                              onClick={() => {
                                setSelectedBooking(b);
                                setDeclineModalOpen(true);
                              }}
                            >
                              Decline
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              icon={CheckCircle2}
                              onClick={() => handleApprove(b.id)}
                            >
                              Approve
                            </Button>
                          </>
                        )}

                        {b.status === 'APPROVED' && (
                          <Button
                            variant="success"
                            size="xs"
                            icon={LogIn}
                            onClick={() => handleCheckIn(b.id)}
                          >
                            Check-In
                          </Button>
                        )}

                        {b.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="xs"
                            icon={LogOut}
                            onClick={() => handleCheckOut(b.id)}
                          >
                            Check-Out
                          </Button>
                        )}

                        {(b.status === 'COMPLETED' || b.status === 'PAID') && (
                          <span className="text-xs text-emerald-600 font-medium">
                            Completed ✓
                          </span>
                        )}

                        {(b.status === 'DECLINED' || b.status === 'CANCELLED') && (
                          <span className="text-xs text-slate-400">Closed</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Decline Reason Modal */}
      {selectedBooking && declineModalOpen && (
        <Modal
          open={declineModalOpen}
          onClose={() => setDeclineModalOpen(false)}
          title={`Decline Booking #BK-${selectedBooking.id}`}
          description="Send cancellation state transition to Booking microservice."
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setDeclineModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleDecline} loading={saving}>
                Confirm Decline
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <label htmlFor="decline-select" className="block text-xs font-semibold text-slate-700">
              Reason for declining request
            </label>
            <Select
              id="decline-select"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            >
              <option value="Storage capacity full">Storage capacity full</option>
              <option value="Facility undergoing maintenance">Facility undergoing maintenance</option>
              <option value="Luggage exceeds oversized item limits">Luggage exceeds oversized item limits</option>
              <option value="Outside operating hours">Outside operating hours</option>
            </Select>
          </div>
        </Modal>
      )}
    </div>
  );
}
