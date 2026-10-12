import React, { useState } from 'react';
import {
  Card,
  StatusBadge,
  Button,
  Modal,
  Alert,
  InfoRow,
  Badge,
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
  UserX,
  RotateCcw,
  RefreshCw,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { userApi, useFetch } from '../../api.js';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: users, loading, error, refetch } = useFetch(() => userApi.listAllUsers());

  const allUsers = users ?? [];

  const filtered = allUsers.filter((u) => {
    const status = u.isActive === false ? 'SUSPENDED' : 'ACTIVE';
    const matchFilter = filter === 'ALL' || status === filter;
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  async function handleConfirm() {
    if (!selected || !action) return;
    setSaving(true);
    setActionError(null);
    try {
      const active = action === 'reinstate';
      await userApi.setStatus(selected.id, active);
      setNotice(
        `User ${selected.name} successfully ${active ? 'reinstated' : 'suspended'}.`
      );
      await refetch();
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setActionError(err.message || 'Could not update user status through the API Gateway.');
    } finally {
      setSaving(false);
      setSelected(null);
      setAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Account Management"
        subtitle="Review platform accounts, verify customer roles, and enforce moderation policies."
        actions={
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {actionError && <Alert variant="danger" title="User update failed">{actionError}</Alert>}

      {notice && (
        <Alert variant="success" title="User Updated">
          {notice}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Failed to load users">
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <FilterBar>
          <div className="flex-1 min-w-[240px]">
            <Input
              id="user-search"
              placeholder="Search user by name or email address..."
              leftIcon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              id="user-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Users</option>
              <option value="SUSPENDED">Suspended Users</option>
            </Select>
          </div>
        </FilterBar>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>User Profile</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Platform Role</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right">Policy Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    Loading user directory...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      description="No registered user profiles matched your current search filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const status = u.isActive === false ? 'SUSPENDED' : 'ACTIVE';
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {u.phone || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'ADMIN' ? 'brand' : u.role === 'PROVIDER' ? 'warning' : 'neutral'} dot={false}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status === 'ACTIVE' && u.role !== 'ADMIN' && (
                            <Button
                              variant="danger-subtle"
                              size="xs"
                              icon={UserX}
                              onClick={() => {
                                setSelected(u);
                                setAction('suspend');
                              }}
                            >
                              Suspend
                            </Button>
                          )}
                          {status === 'SUSPENDED' && (
                            <Button
                              variant="secondary"
                              size="xs"
                              icon={RotateCcw}
                              onClick={() => {
                                setSelected(u);
                                setAction('reinstate');
                              }}
                            >
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

      {/* Confirmation Modal */}
      {selected && action && (
        <Modal
          open={!!selected && !!action}
          onClose={() => {
            setSelected(null);
            setAction(null);
          }}
          title={action === 'suspend' ? 'Suspend User Account' : 'Reinstate User Account'}
          description={`Are you sure you want to ${action} account for ${selected.name}?`}
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
                variant={action === 'suspend' ? 'danger' : 'primary'}
                size="md"
                onClick={handleConfirm}
                loading={saving}
              >
                Confirm {action === 'suspend' ? 'Suspension' : 'Reinstatement'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {action === 'suspend' ? (
              <Alert variant="danger" title="Account Suspension Notice">
                Suspending this user will terminate their active sessions and restrict them from creating new luggage bookings across the platform.
              </Alert>
            ) : (
              <Alert variant="info" title="Account Reinstatement">
                Reinstating this user will restore full booking and platform privileges immediately.
              </Alert>
            )}

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <InfoRow label="User Name" value={selected.name} />
              <InfoRow label="Email Address" value={selected.email} />
              <InfoRow label="Assigned Role" value={selected.role} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
