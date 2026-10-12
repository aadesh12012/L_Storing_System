import React, { useState } from 'react';
import {
  Card,
  Button,
  Alert,
  InfoRow,
  PageHeader,
  FormField,
  Input,
} from '../../components/ui.jsx';
import { Save, RefreshCw } from 'lucide-react';
import { paymentApi, useFetch } from '../../api.js';

/**
 * Real CommissionConfigRequest/Response fields (Payment Service):
 *   commissionRate  — decimal fraction, e.g. 0.15 for 15% (NOT a 0-100 percent)
 *   minHourlyRate, maxHourlyRate — pricing guardrails
 * The form always loads the actual current configuration via
 * GET /api/v1/payments/admin/commission before allowing edits.
 */
export default function AdminSettings() {
  const { data: config, loading, error, refetch } = useFetch(() => paymentApi.getCommission());

  const [commissionPercent, setCommissionPercent] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [loadedConfig, setLoadedConfig] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // React-recommended "adjust state during render" pattern instead of an
  // effect: seed the form fields the moment the real config arrives (or
  // changes after a save), without an extra render-then-effect round trip.
  if (config && config !== loadedConfig) {
    setLoadedConfig(config);
    setCommissionPercent(config.commissionRate != null ? String(Number(config.commissionRate) * 100) : '');
    setMinRate(config.minHourlyRate != null ? String(config.minHourlyRate) : '');
    setMaxRate(config.maxHourlyRate != null ? String(config.maxHourlyRate) : '');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await paymentApi.updateCommission({
        commissionRate: Number(commissionPercent) / 100,
        minHourlyRate: minRate ? Number(minRate) : undefined,
        maxHourlyRate: maxRate ? Number(maxRate) : undefined,
      });
      setSaved(true);
      await refetch();
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setSaveError(err.message || 'Failed to update commission configuration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Policy & Economic Parameters"
        subtitle="Configure the global marketplace commission and pricing guardrails (A-5, A-6)."
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {saved && (
        <Alert variant="success" title="Policy Updated">
          Marketplace commission configuration has been applied via the Payment Service.
        </Alert>
      )}

      {(error || saveError) && (
        <Alert variant="danger" title="Commission configuration error">
          {saveError || error}
        </Alert>
      )}

      {config && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Currently active configuration
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <InfoRow label="Commission rate" value={config.commissionPercentage || `${(Number(config.commissionRate) * 100).toFixed(2)}%`} />
            <InfoRow label="Min hourly rate" value={config.minHourlyRate != null ? `₹${config.minHourlyRate}` : '—'} />
            <InfoRow label="Max hourly rate" value={config.maxHourlyRate != null ? `₹${config.maxHourlyRate}` : '—'} />
          </div>
        </Card>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Configuration */}
        <Card>
          <Card.Header
            title="Marketplace Commission"
            subtitle="Platform transaction fee split from customer storage payments"
          />
          <Card.Body className="space-y-5">
            <FormField
              label="Commission Take Rate (%)"
              htmlFor="commission-rate"
              required
              hint={loading ? 'Loading current rate...' : undefined}
            >
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                disabled={loading}
              />
            </FormField>

          </Card.Body>
        </Card>

        {/* Pricing Guardrails */}
        <Card>
          <Card.Header
            title="Hourly Pricing Guardrails"
            subtitle="Bounds preventing predatory pricing or unsustainable discounting"
          />
          <Card.Body className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Minimum Rate (₹/hr)" htmlFor="min-rate" hint="Floor price">
                <Input
                  id="min-rate"
                  type="number"
                  min="0"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  disabled={loading}
                />
              </FormField>

              <FormField label="Maximum Rate (₹/hr)" htmlFor="max-rate" hint="Ceiling price">
                <Input
                  id="max-rate"
                  type="number"
                  min="0"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  disabled={loading}
                />
              </FormField>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="primary" size="md" icon={Save} type="submit" loading={saving} disabled={loading}>
                Save Platform Policies
              </Button>
            </div>
          </Card.Body>
        </Card>
      </form>
    </div>
  );
}
