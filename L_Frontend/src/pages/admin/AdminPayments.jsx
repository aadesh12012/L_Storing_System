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
  FormField,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer,
  EmptyState,
  PaymentSimulationNotice,
} from '../../components/ui.jsx';
import {
  Search,
  RotateCcw,
  RefreshCw,
  CreditCard,
  Receipt,
  DollarSign,
  ArrowDownLeft,
} from 'lucide-react';
import { paymentApi, useFetch } from '../../api.js';

function fmtAmount(amount) {
  if (amount == null) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function AdminPayments() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: payments, loading, error, refetch } = useFetch(() =>
    paymentApi.getAllPayments()
  );

  const all = payments ?? [];

  const filtered = all.filter((p) => {
    const matchFilter = filter === 'ALL' || p.status === filter;
    const matchSearch =
      String(p.id).includes(search) ||
      String(p.bookingId ?? '').includes(search) ||
      String(p.userId ?? '').includes(search) ||
      String(p.providerId ?? '').includes(search);
    return matchFilter && matchSearch;
  });

  function openRefund(p) {
    setSelected(p);
    setRefundAmount(p.amount != null ? String(p.amount) : '');
    setRefundOpen(true);
  }

  async function handleRefund() {
    if (!selected) return;
    if (!refundReason) {
      setActionError('Select a refund reason.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await paymentApi.refund(selected.id, {
        amount: parseFloat(refundAmount),
        reason: refundReason,
      });
      setNotice(`Simulated refund recorded for transaction ${selected.id}.`);
      await refetch();
      setRefundOpen(false);
      setSelected(null);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Could not process the refund through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Records"
        subtitle="Review payment-service records and record simulated refunds."
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      <PaymentSimulationNotice />

      {actionError && <Alert variant="danger" title="Refund failed">{actionError}</Alert>}

      {notice && (
        <Alert variant="success" title="Refund record updated">
          {notice}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Error loading payments">
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <FilterBar>
          <div className="flex-1 min-w-[240px]">
            <Input
              id="admin-payment-search"
              placeholder="Search by transaction ID, booking code, or user..."
              leftIcon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              id="admin-payment-status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Payment States</option>
              <option value="SUCCESS">Successful</option>
              <option value="PROCESSING">Processing</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially refunded</option>
            </Select>
          </div>
        </FilterBar>
      </Card>

      {/* Transactions Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Transaction Ref</TableHead>
                <TableHead>Booking Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Platform Commission</TableHead>
                <TableHead>Provider Earnings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    Loading financial ledger...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon={CreditCard}
                      title="No transactions found"
                      description="No records matched your search query."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {p.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        BK-{p.bookingId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">User #{p.userId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800">Provider #{p.providerId}</p>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {fmtAmount(p.amount)}
                    </TableCell>
                    <TableCell className="text-emerald-700 font-medium text-xs">
                      {fmtAmount(p.commissionAmount)}
                      {p.commissionRate != null && (
                        <span className="text-slate-400"> ({(Number(p.commissionRate) * 100).toFixed(1)}%)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {fmtAmount(p.providerEarnings)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === 'SUCCESS' && (
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={RotateCcw}
                          onClick={() => openRefund(p)}
                        >
                          Issue Refund
                        </Button>
                      )}
                      {p.status === 'REFUNDED' && (
                        <span className="text-xs text-slate-400 font-medium">Refunded</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Refund Modal */}
      {selected && refundOpen && (
        <Modal
          open={refundOpen}
          onClose={() => {
            setRefundOpen(false);
            setSelected(null);
          }}
          title={`Record simulated refund — ${selected.id}`}
          description={`Payment-service record of ${fmtAmount(selected.amount)} for Booking BK-${selected.bookingId}`}
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setRefundOpen(false);
                  setSelected(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleRefund}
                loading={saving}
                disabled={!refundReason || saving}
              >
                Record refund (₹{refundAmount})
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Alert variant="warning" title="Simulated refund">
              This records a refund result in the payment service. No money is returned or transferred.
            </Alert>

            <FormField label="Refund amount (₹)" htmlFor="refund-amount" required>
              <Input
                id="refund-amount"
                type="number"
                min="1"
                max={selected.amount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </FormField>

            <FormField label="Refund reason" htmlFor="refund-reason" required>
              <Select
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              >
                <option value="" disabled>Select a reason</option>
                <option value="Customer dispute resolution">Customer dispute resolution</option>
                <option value="Early bag pickup adjustment">Early bag pickup adjustment</option>
                <option value="Storage provider cancellation / unavailability">Storage provider cancellation / unavailability</option>
                <option value="Duplicate billing error">Duplicate billing error</option>
              </Select>
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}
