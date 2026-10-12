import React, { useState } from 'react';
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
  Modal,
  InfoRow,
  PaymentSimulationNotice,
} from '../../components/ui.jsx';
import {
  Eye,
  RefreshCw,
  CreditCard,
  Receipt,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { paymentApi, auth, useFetch } from '../../api.js';

function fmtAmount(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function fmtDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return val;
  }
}

export default function UserPayments() {
  const userId = auth.userId();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const { data: payments, loading, error, refetch } = useFetch(
    () => paymentApi.getByUser(userId),
    [userId]
  );

  const all = payments || [];

  const successfulPayments = all.filter((p) => p.status === 'SUCCESS');
  const totalSpent = successfulPayments
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalRefunded = all
    .reduce((sum, p) => sum + (Number(p.refundedAmount) || 0), 0);
  const avgPerPayment = successfulPayments.length > 0
    ? Math.round(totalSpent / successfulPayments.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Records"
        subtitle={`Payment-service records for User #${userId}.`}
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      <PaymentSimulationNotice />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Successful payment amount"
          value={loading ? '...' : fmtAmount(totalSpent)}
          change="Recorded amount"
          changeType="neutral"
          icon={CreditCard}
        />
        <StatCard
          label="Payment records"
          value={loading ? '...' : String(all.length)}
          change={`${successfulPayments.length} successful`}
          changeType="neutral"
          icon={Receipt}
        />
        <StatCard
          label="Average successful record"
          value={loading ? '...' : fmtAmount(avgPerPayment)}
          change="Per payment record"
          changeType="neutral"
          icon={FileCheck}
        />
        <StatCard
          label="Recorded refund amount"
          value={loading ? '...' : fmtAmount(totalRefunded)}
          change={totalRefunded > 0 ? 'Recorded amount' : 'None recorded'}
          changeType="neutral"
          icon={CheckCircle2}
        />
      </div>

      {error && (
        <Alert variant="danger" title="API Gateway Payment Service Notice">
          {error}
        </Alert>
      )}

      {/* Transactions Table */}
      <Card>
        <Card.Header
          title="Payment-service records"
          subtitle="Amounts and statuses returned by the payment service."
        />
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Payment ID</TableHead>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Loading payments through API Gateway...
                  </TableCell>
                </TableRow>
              ) : all.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon={Receipt}
                      title="No payment records found"
                      description="Payment-service records will appear here when available."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                all.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        TXN-{p.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        BK-{p.bookingId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600 text-xs font-medium">
                        {p.paymentMethod || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {fmtDate(p.createdAt)}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {fmtAmount(p.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Eye}
                        onClick={() => setSelectedReceipt(p)}
                      >
                        View record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Payment record details */}
      {selectedReceipt && (
        <Modal
          open={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="Payment Record"
          description={`Payment-service record #TXN-${selectedReceipt.id}`}
          footer={
            <Button variant="primary" size="md" onClick={() => setSelectedReceipt(null)}>
              Done
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <InfoRow label="Payment ID" value={`TXN-${selectedReceipt.id}`} />
              <InfoRow label="Booking Code" value={`BK-${selectedReceipt.bookingId}`} />
              <InfoRow label="User ID" value={String(selectedReceipt.userId)} />
              <InfoRow label="Provider ID" value={String(selectedReceipt.providerId)} />
              <InfoRow label="Gateway Transaction ID" value={selectedReceipt.gatewayTxnId || '—'} />
              <InfoRow label="Payment Method" value={selectedReceipt.paymentMethod || '—'} />
              <InfoRow label="Timestamp" value={fmtDate(selectedReceipt.createdAt)} />
              <InfoRow label="Status" value={selectedReceipt.status} />
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">Recorded amount</span>
                <span className="font-bold text-base text-blue-700">
                  {fmtAmount(selectedReceipt.amount)}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
