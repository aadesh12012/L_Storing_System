import React, { useState } from 'react';
import {
  StatCard,
  Card,
  StatusBadge,
  InfoRow,
  PageHeader,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableContainer,
  Modal,
  Alert,
  FormField,
  Input,
  Select,
  EmptyState,
  PaymentSimulationNotice,
} from '../../components/ui.jsx';
import {
  CreditCard,
  Building2,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { paymentApi, useFetch } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

function fmtAmount(amount) {
  if (amount == null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

/**
 * Real fields returned by GET /api/v1/payments/provider/{id}/earnings
 * (ProviderEarningsResponse): totalGrossEarnings, totalCommissionPaid,
 * totalNetEarnings, totalPaidOut, availablePayoutBalance,
 * completedPaymentsCount. Nothing here is invented or approximated.
 */
export default function ProviderEarnings() {
  const { providerId } = useAuth();
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('STRIPE_CONNECT');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [saving, setSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const {
    data: earnings,
    loading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useFetch(() => paymentApi.getEarnings(providerId), [providerId]);

  const {
    data: payouts,
    loading: payoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts,
  } = useFetch(() => paymentApi.getPayouts(providerId), [providerId]);

  const payoutList = payouts || [];
  const mostRecentPayout = payoutList[0];

  function refetchAll() {
    refetchEarnings();
    refetchPayouts();
  }

  function openPayoutModal() {
    setRequestAmount(earnings?.availablePayoutBalance ? String(earnings.availablePayoutBalance) : '');
    setDestinationAccount(mostRecentPayout?.destinationAccount || '');
    setErrorMsg(null);
    setPayoutModalOpen(true);
  }

  async function handleRequestPayout() {
    setSaving(true);
    setErrorMsg(null);
    try {
      await paymentApi.requestPayout(providerId, {
        amount: requestAmount ? Number(requestAmount) : undefined,
        payoutMethod,
        destinationAccount: destinationAccount || undefined,
      });
      setSuccessNotice(`Simulated payout request for ₹${requestAmount || 'available balance'} recorded.`);
      setPayoutModalOpen(false);
      refetchAll();
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit payout request through API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings & Payout Records"
        subtitle={`Payment-service records for Provider #${providerId}.`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetchAll}>
              Refresh
            </Button>
            <Button variant="primary" size="md" icon={ArrowUpRight} onClick={openPayoutModal}>
              Request Simulated Payout
            </Button>
          </div>
        }
      />

      <PaymentSimulationNotice />

      {successNotice && (
        <Alert variant="success" title="Payout request recorded">
          {successNotice}
        </Alert>
      )}

      {earningsError && (
        <Alert variant="danger" title="API Gateway Notice">
          {earningsError}
        </Alert>
      )}

      {payoutsError && (
        <Alert variant="danger" title="Payout history could not be loaded">
          {payoutsError}
        </Alert>
      )}

      {/* KPI Cards — real ProviderEarningsResponse fields only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Recorded gross earnings"
          value={earningsLoading || !earnings ? '...' : fmtAmount(earnings.totalGrossEarnings)}
          change={
            earnings ? `${earnings.completedPaymentsCount ?? 0} completed payment(s)` : 'Recorded in database'
          }
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          label="Recorded platform commission"
          value={earningsLoading || !earnings ? '...' : fmtAmount(earnings.totalCommissionPaid)}
          change="Recorded by Payment Service"
          changeType="neutral"
          icon={Receipt}
        />
        <StatCard
          label="Available Balance"
          value={earningsLoading || !earnings ? '...' : fmtAmount(earnings.availablePayoutBalance)}
          change="Available in payout simulator"
          changeType="positive"
          icon={CreditCard}
        />
        <StatCard
          label="Payouts marked successful"
          value={earningsLoading || !earnings ? '...' : fmtAmount(earnings.totalPaidOut)}
          change="Payment-service records"
          changeType="neutral"
          icon={CheckCircle2}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payout table (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header
              title="Payout Records"
              subtitle="Status and amount returned by the payment service."
            />
            <TableContainer>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {payoutsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                        Querying API Gateway for payout records...
                      </TableCell>
                    </TableRow>
                  ) : payoutList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState
                          icon={Receipt}
                          title="No payout records"
                          description="Payout-service records will appear here when available."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    payoutList.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            PO-{p.id}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-medium">
                          {p.destinationAccount || '—'}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {fmtAmount(p.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </div>

        {/* Payout destination summary */}
        <div className="space-y-6">
          <Card>
            <Card.Header
              title="Most Recent Payout Destination"
              subtitle="From the latest payout-service record"
            />
            <Card.Body className="space-y-3">
              {mostRecentPayout ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-semibold">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    {mostRecentPayout.payoutMethod || 'Payout account'}
                  </div>
                  <InfoRow label="Destination Account" value={mostRecentPayout.destinationAccount} />
                  <InfoRow label="Reference ID" value={mostRecentPayout.referenceId} />
                  <InfoRow label="Provider Entity" value={`Provider #${providerId}`} />
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed">
                  No payouts requested yet. Your destination account details will appear here once you
                  submit a payout request.
                </p>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Payout Modal */}
      <Modal
        open={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        title="Request Simulated Payout"
        description="Record a payout request with the Payment Service."
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setPayoutModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleRequestPayout} loading={saving}>
              Record payout request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {errorMsg && (
            <Alert variant="danger" title="Gateway Error">
              {errorMsg}
            </Alert>
          )}

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Available Balance:</span>
            <span className="text-base font-bold text-blue-700">
              {fmtAmount(earnings?.availablePayoutBalance ?? 0)}
            </span>
          </div>

          <FormField
            label="Payout amount (₹)"
            htmlFor="payout-amt"
            hint="Leave blank to pay out the full available balance"
          >
            <Input
              id="payout-amt"
              type="number"
              min="1"
              max={earnings?.availablePayoutBalance || undefined}
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder={fmtAmount(earnings?.availablePayoutBalance ?? 0)}
            />
          </FormField>

          <FormField label="Payout Method" htmlFor="payout-method" required>
            <Select id="payout-method" value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
              <option value="STRIPE_CONNECT">Stripe Connect (simulated)</option>
              <option value="BANK_TRANSFER">Bank transfer (simulated)</option>
            </Select>
          </FormField>

          <FormField
            label="Destination Account"
            htmlFor="payout-dest"
            hint="Recorded as a destination reference; no transfer is made"
          >
            <Input
              id="payout-dest"
              value={destinationAccount}
              onChange={(e) => setDestinationAccount(e.target.value)}
              placeholder="Destination account reference"
            />
          </FormField>

        </div>
      </Modal>
    </div>
  );
}
