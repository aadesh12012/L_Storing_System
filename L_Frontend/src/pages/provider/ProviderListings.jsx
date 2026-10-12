import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Alert,
  InfoRow,
  PageHeader,
  FormField,
  Input,
  Select,
  Textarea,
  EmptyState,
} from '../../components/ui.jsx';
import {
  Store,
  Plus,
  MapPin,
  Clock,
  RefreshCw,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { providerApi, useFetch } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProviderListings() {
  const { providerId } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data: locations, loading, error, refetch } = useFetch(
    () => providerApi.getLocations(providerId),
    [providerId]
  );

  const list = locations || [];

  async function handleCreate(e) {
    e.preventDefault();
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!address.trim()) {
      setErrorMsg('Enter the storage location address.');
      return;
    }
    if (!latitude || !Number.isFinite(lat) || lat < -90 || lat > 90) {
      setErrorMsg('Enter a valid latitude between -90 and 90.');
      return;
    }
    if (!longitude || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      setErrorMsg('Enter a valid longitude between -180 and 180.');
      return;
    }
    if (!openTime || !closeTime) {
      setErrorMsg('Enter both opening and closing times.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      // Exact DTO contract matching StorageLocationRequest.java in ProviderService
      const payload = {
        address: address.trim(),
        latitude: lat,
        longitude: lon,
        operatingHoursOpen: openTime,
        operatingHoursClose: closeTime,
        isAvailable: true,
      };

      await providerApi.addLocation(providerId, payload);
      setSuccessMsg('Storage location created in database via Provider Service.');
      setModalOpen(false);
      setAddress('');
      setLatitude('');
      setLongitude('');
      setOpenTime('');
      setCloseTime('');
      refetch();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add location through API Gateway.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(id, currentStatus) {
    setActionError(null);
    try {
      await providerApi.setLocationAvailability(id, !currentStatus);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Could not update location availability through the API Gateway.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage Locations & Facilities"
        subtitle={`Physical lockers and storage hubs registered under Provider #${providerId}.`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" icon={RefreshCw} onClick={refetch}>
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setModalOpen(true)}
            >
              Add New Location
            </Button>
          </div>
        }
      />

      {successMsg && (
        <Alert variant="success" title="Location Created">
          {successMsg}
        </Alert>
      )}

      {actionError && <Alert variant="danger" title="Location update failed">{actionError}</Alert>}

      {error && (
        <Alert variant="danger" title="API Gateway Notice">
          {error}
        </Alert>
      )}

      {/* Grid of locations */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No storage locations registered yet"
          description="Your provider account has no active facilities registered in the Provider microservice database."
          action={
            <Button variant="primary" size="md" icon={Plus} onClick={() => setModalOpen(true)}>
              Register First Location
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map((loc) => {
            const isAvail = loc.isAvailable !== false;
            return (
              <Card key={loc.id} className="flex flex-col justify-between">
                <Card.Header
                  title={loc.address || `Storage Location #${loc.id}`}
                  subtitle={`Provider #${loc.providerId} · Database Record ID #${loc.id}`}
                >
                  <Badge variant={isAvail ? 'success' : 'danger'}>
                    {isAvail ? 'Accepting Drop-offs' : 'Closed / Unavailable'}
                  </Badge>
                </Card.Header>

                <Card.Body className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                    <InfoRow label="Address" value={loc.address} />
                    <InfoRow
                      label="Coordinates"
                      value={`${loc.latitude?.toFixed(4) || '—'}, ${loc.longitude?.toFixed(4) || '—'}`}
                    />
                    <InfoRow
                      label="Operating Hours"
                      value={
                        loc.operatingHoursOpen && loc.operatingHoursClose
                          ? `${loc.operatingHoursOpen} – ${loc.operatingHoursClose}`
                          : 'Not specified'
                      }
                    />
                    <InfoRow
                      label="Current State"
                      value={isAvail ? 'Active & Live' : 'Offline'}
                    />
                  </div>
                </Card.Body>

                <Card.Footer className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Provider Service via API Gateway
                  </span>
                  <Button
                    variant={isAvail ? 'secondary' : 'primary'}
                    size="sm"
                    icon={Power}
                    onClick={() => toggleAvailability(loc.id, isAvail)}
                  >
                    {isAvail ? 'Set Unavailable' : 'Set Available'}
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Location Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register New Storage Location"
        description="Creates a new storage facility record in the Provider microservice database."
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreate} loading={saving}>
              Save to Database
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {errorMsg && (
            <Alert variant="danger" title="Validation / Gateway Error">
              {errorMsg}
            </Alert>
          )}

          <FormField label="Full Physical Address" htmlFor="loc-address" required>
            <Textarea
              id="loc-address"
              rows={2}
              placeholder="Enter the full street address and nearby landmark"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Latitude" htmlFor="loc-lat" required>
              <Input
                id="loc-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Longitude" htmlFor="loc-lng" required>
              <Input
                id="loc-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Opening Time (HH:mm)" htmlFor="open-time" required>
              <Input
                id="open-time"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Closing Time (HH:mm)" htmlFor="close-time" required>
              <Input
                id="close-time"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
