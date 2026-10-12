import React, { useMemo, useState } from 'react';
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
  Store,
  RefreshCw,
  Eye,
  MapPin,
  Power,
} from 'lucide-react';
import { providerApi, useFetch } from '../../api.js';

/**
 * The Provider Service does not expose a single "list all providers"
 * endpoint — only GET /api/v1/providers/kyc/pending (pending KYC only). To
 * show a real, non-fabricated provider directory, this page unions two
 * genuine sources: the pending-KYC queue, and every distinct Provider that
 * owns at least one real storage location (joined client-side via
 * providerApi.getAllLocationsWithProviders). Providers with neither a
 * pending KYC record nor any registered location are not currently
 * retrievable by any backend endpoint — that is a real backend gap, not a
 * frontend omission.
 */
function useProviderDirectory() {
  const pendingKyc = useFetch(() => providerApi.listPendingKyc());
  const locations = useFetch(() => providerApi.getAllLocationsWithProviders());

  const providers = useMemo(() => {
    const map = new Map();
    (pendingKyc.data ?? []).forEach((p) => {
      map.set(p.id, { ...p, locations: [] });
    });
    (locations.data ?? []).forEach((loc) => {
      if (!loc.provider) return;
      const existing = map.get(loc.provider.id) ?? { ...loc.provider, locations: [] };
      existing.locations = [...existing.locations, loc];
      map.set(loc.provider.id, existing);
    });
    return Array.from(map.values());
  }, [pendingKyc.data, locations.data]);

  return {
    providers,
    loading: pendingKyc.loading || locations.loading,
    error: pendingKyc.error || locations.error,
    refetch: () => {
      pendingKyc.refetch();
      locations.refetch();
    },
  };
}

export default function AdminProviders() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // 'suspend' | 'reinstate' | 'details'
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { providers, loading, error, refetch } = useProviderDirectory();

  const filtered = providers.filter((p) => {
    const status = !p.isActive ? 'SUSPENDED' : p.kycStatus || 'PENDING';
    const matchFilter = filter === 'ALL' || status === filter;
    const matchSearch = (p.businessName ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  async function handleStatusToggle(p, activate) {
    setSaving(true);
    setActionError(null);
    try {
      await providerApi.setStatus(p.id, activate);
      setNotice(`Storage provider ${p.businessName} ${activate ? 'reinstated' : 'suspended'}.`);
      setSelected(null);
      setAction(null);
      await refetch();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Could not update provider status through the API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage Provider Fleet"
        subtitle="Providers with pending approval or at least one registered storage location."
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {notice && (
        <Alert variant="success" title="Provider Updated">
          {notice}
        </Alert>
      )}

      {actionError && <Alert variant="danger" title="Provider update failed">{actionError}</Alert>}

      {error && (
        <Alert variant="danger" title="Error loading providers">
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <FilterBar>
          <div className="flex-1 min-w-[240px]">
            <Input
              id="provider-search"
              placeholder="Search by business name..."
              leftIcon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select id="provider-status-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All Hub Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending approval</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended Hubs</option>
            </Select>
          </div>
        </FilterBar>
      </Card>

      {/* Providers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Storage Hub</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    Loading provider network...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={Store}
                      title="No storage hubs found"
                      description="No providers with a pending approval or registered location match your query."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const status = !p.isActive ? 'SUSPENDED' : p.kycStatus || 'PENDING';
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{p.businessName}</p>
                        <p className="text-xs text-slate-500">Provider #{p.id} · User #{p.userId}</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {p.locations.length === 0 ? (
                          <span className="text-slate-400">No locations registered</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {p.locations.length} location{p.locations.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {p.currentLoad ?? 0} / {p.capacity ?? '—'} bags
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {p.hourlyRate != null ? `₹${p.hourlyRate} / hr` : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Eye}
                            onClick={() => {
                              setSelected(p);
                              setAction('details');
                            }}
                          >
                            Details
                          </Button>
                          {p.isActive !== false ? (
                            <Button
                              variant="danger-subtle"
                              size="xs"
                              icon={Power}
                              onClick={() => {
                                setSelected(p);
                                setAction('suspend');
                              }}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button variant="secondary" size="xs" onClick={() => handleStatusToggle(p, true)}>
                              Reinstate
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

      {/* Provider Details Modal */}
      {selected && action === 'details' && (
        <Modal
          open={!!selected}
          onClose={() => {
            setSelected(null);
            setAction(null);
          }}
          title={selected.businessName}
          description={`Provider #${selected.id} · User #${selected.userId}`}
          footer={
            <Button variant="secondary" size="md" onClick={() => { setSelected(null); setAction(null); }}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <InfoRow label="Business Name" value={selected.businessName} />
              <InfoRow label="Owner User ID" value={String(selected.userId)} />
              <InfoRow label="Hourly Rate" value={selected.hourlyRate != null ? `₹${selected.hourlyRate} / hr per bag` : '—'} />
              <InfoRow label="Capacity" value={`${selected.currentLoad ?? 0} / ${selected.capacity ?? '—'} bags in use`} />
              <InfoRow label="Provider approval status" value={selected.kycStatus} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Registered Locations</p>
              {selected.locations.length === 0 ? (
                <p className="text-xs text-slate-400">No storage locations registered for this provider.</p>
              ) : (
                <div className="space-y-2">
                  {selected.locations.map((loc) => (
                    <div key={loc.id} className="p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {loc.address}
                      </span>
                      <StatusBadge status={loc.isAvailable !== false ? 'ACTIVE' : 'SUSPENDED'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Suspend Confirmation Modal */}
      {selected && action === 'suspend' && (
        <Modal
          open={!!selected}
          onClose={() => { setSelected(null); setAction(null); }}
          title="Suspend Storage Provider"
          description={`Are you sure you want to suspend ${selected.businessName}?`}
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => { setSelected(null); setAction(null); }} disabled={saving}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={() => handleStatusToggle(selected, false)} loading={saving}>
                Confirm Suspension
              </Button>
            </>
          }
        >
          <Alert variant="danger" title="Network Delisting Impact">
            Suspending this hub will immediately remove it from customer search results and prevent any new reservations. Existing checked-in luggage must still be fulfilled.
          </Alert>
        </Modal>
      )}
    </div>
  );
}
