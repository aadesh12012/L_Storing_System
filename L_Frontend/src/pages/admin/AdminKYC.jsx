import React, { useEffect, useState } from 'react';
import {
  Card,
  StatusBadge,
  Button,
  Modal,
  Alert,
  InfoRow,
  PageHeader,
  EmptyState,
} from '../../components/ui.jsx';
import {
  ShieldCheck,
  ShieldX,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { providerApi, userApi, useFetch } from '../../api.js';

/**
 * Owner contact details are real data fetched from the User Service
 * (GET /api/v1/users/{id}) using the real userId stored on each Provider
 * record — never invented. Document upload/review is NOT implemented by any
 * backend service (no such endpoint exists in the Provider Service), so this
 * screen does not fabricate a documents section.
 */
function useOwnerProfiles(providers) {
  const [owners, setOwners] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = (providers ?? []).filter((p) => !(p.userId in owners));
      if (missing.length === 0) return;
      setError(null);
      try {
        const results = await Promise.all(missing.map((p) => userApi.getProfile(p.userId)));
        if (cancelled) return;
        setOwners((prev) => {
          const next = { ...prev };
          missing.forEach((p, idx) => {
            next[p.userId] = results[idx];
          });
          return next;
        });
      } catch (fetchError) {
        if (!cancelled) setError(fetchError.message || 'Could not load provider owners from the API Gateway.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  return { owners, error };
}

export default function AdminKYC() {
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [locationsByProvider, setLocationsByProvider] = useState({});
  const [locationsError, setLocationsError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: submissions, loading, error, refetch } = useFetch(() => providerApi.listPendingKyc());

  const list = submissions ?? [];
  const { owners, error: ownersError } = useOwnerProfiles(list);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = list.filter((p) => !(p.id in locationsByProvider));
      if (missing.length === 0) return;
      setLocationsError(null);
      try {
        const results = await Promise.all(missing.map((p) => providerApi.getLocations(p.id)));
        if (cancelled) return;
        setLocationsByProvider((prev) => {
          const next = { ...prev };
          missing.forEach((p, idx) => {
            next[p.id] = results[idx];
          });
          return next;
        });
      } catch (fetchError) {
        if (!cancelled) setLocationsError(fetchError.message || 'Could not load provider locations from the API Gateway.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  function open(submission, act) {
    setSelected(submission);
    setAction(act);
  }

  async function handleConfirm() {
    if (!selected || !action) return;
    setSaving(true);
    setActionError(null);
    try {
      // Real Provider.KycStatus enum values are PENDING / APPROVED / REJECTED.
      const kycStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      await providerApi.updateKyc(selected.id, kycStatus);
      if (action === 'approve') {
        await providerApi.setStatus(selected.id, true);
      }
      setNotice(
        `Provider ${selected.businessName} has been ${action === 'approve' ? 'approved and activated' : 'rejected'}.`
      );
      await refetch();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Could not update provider KYC status through the API Gateway.');
    } finally {
      setSaving(false);
      setSelected(null);
      setAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provider Approval Queue"
        subtitle="Review pending provider profiles and approve or reject their status."
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {notice && (
        <Alert variant="success" title="Provider status updated">
          {notice}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Failed to load provider queue">
          {error}
        </Alert>
      )}

      {(ownersError || locationsError || actionError) && (
        <Alert variant="danger" title="Provider details or action failed">
          {ownersError || locationsError || actionError}
        </Alert>
      )}

      <Alert variant="info" title="Document review unavailable">
        This queue manages provider profile status. Identity-document upload and review are not available.
      </Alert>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No providers awaiting approval"
        />
      ) : (
        <div className="space-y-6">
          {list.map((s) => {
            const owner = owners[s.userId];
            const locs = locationsByProvider[s.id] ?? [];
            return (
              <Card key={s.id} className="overflow-hidden">
                <Card.Header
                  title={s.businessName}
                  subtitle={owner ? `Submitted by ${owner.name} (${owner.email})` : `User #${s.userId}`}
                >
                  <StatusBadge status="PENDING_KYC" />
                </Card.Header>

                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Partner info — all real Provider Service fields */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <InfoRow label="Business Name" value={s.businessName} />
                      <InfoRow label="Owner Name" value={owner?.name} />
                      <InfoRow label="Owner Email" value={owner?.email} />
                      <InfoRow label="Owner Phone" value={owner?.phone} />
                      <InfoRow label="Requested Hourly Rate" value={s.hourlyRate != null ? `₹${s.hourlyRate}/hr` : '—'} />
                      <InfoRow label="Requested Capacity" value={s.capacity != null ? `${s.capacity} bags` : '—'} />
                    </div>

                    {/* Right: real registered locations, not invented documents */}
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                        Registered Storage Locations
                      </span>
                      {locs.length > 0 ? (
                        <div className="space-y-2">
                          {locs.map((loc) => (
                            <div
                              key={loc.id}
                              className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white text-xs"
                            >
                              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-medium text-slate-800">{loc.address}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No storage locations registered yet.</p>
                      )}
                    </div>
                  </div>
                </Card.Body>

                <Card.Footer className="flex items-center justify-end gap-3">
                  <Button variant="secondary" size="md" icon={ShieldX} onClick={() => open(s, 'reject')}>
                    Reject Provider
                  </Button>
                  <Button variant="primary" size="md" icon={ShieldCheck} onClick={() => open(s, 'approve')}>
                    Approve Provider
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {selected && action && (
        <Modal
          open={!!selected && !!action}
          onClose={() => {
            setSelected(null);
            setAction(null);
          }}
          title={action === 'approve' ? 'Approve Provider Profile' : 'Reject Provider Profile'}
          description={`Confirm your decision for ${selected.businessName}`}
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setSelected(null);
                  setAction(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant={action === 'approve' ? 'primary' : 'danger'}
                size="md"
                onClick={handleConfirm}
                loading={saving}
              >
                Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {action === 'approve' ? (
              <Alert variant="success" title="Approval Impact">
                Approving this provider will publish their storage hubs live on the marketplace search engine, allowing travellers to begin booking custody immediately.
              </Alert>
            ) : (
              <Alert variant="danger" title="Rejection Impact">
                Rejecting this application will notify the applicant to resubmit compliant legal or trade documentation.
              </Alert>
            )}

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <InfoRow label="Facility Name" value={selected.businessName} />
              <InfoRow label="Provider ID" value={String(selected.id)} />
              <InfoRow label="Owner User ID" value={String(selected.userId)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
