import React, { useState } from 'react';
import {
  Button,
  Badge,
  Modal,
  Alert,
  InfoRow,
  Input,
  Select,
  FormField,
  EmptyState,
} from '../../components/ui.jsx';
import {
  MapPin,
  Clock,
  Luggage,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { providerApi, bookingApi, auth, useFetch } from '../../api.js';
import EcommerceLayout from '../../components/EcommerceLayout.jsx';

// Compact Amazon-style storage location card
function StorageCard({ location, onBook }) {
  const provider = location.provider;
  const isAvailable = location.isAvailable !== false && provider?.isActive !== false;
  const rate = provider?.hourlyRate;
  const isApproved = provider?.kycStatus === 'APPROVED' || provider?.kycStatus === 'VERIFIED';

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150 p-4 h-full flex flex-col">
      {/* Status Badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1">
          {isApproved && (
            <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" />
              <span>Provider approved</span>
            </div>
          )}
        </div>
        {isAvailable ? (
          <Badge variant="success" dot={false} className="text-xs px-2 py-0.5">Available</Badge>
        ) : (
          <Badge variant="neutral" dot={false} className="text-xs px-2 py-0.5">Closed</Badge>
        )}
      </div>

      {/* Provider Name */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
        {provider?.businessName || `Provider #${location.providerId}`}
      </h3>

      {/* Location Address */}
      <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-2">
        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
        <span className="line-clamp-2">{location.address}</span>
      </div>

      {/* Hours */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
        <Clock className="w-3 h-3 shrink-0 text-gray-400" />
        <span>
          {location.operatingHoursOpen && location.operatingHoursClose
            ? `${location.operatingHoursOpen} - ${location.operatingHoursClose}`
            : 'Hours not specified'}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Price and CTA */}
      <div className="border-t border-gray-200 pt-4 mt-3">
        <div className="flex items-center justify-between">
          <div>
            {rate != null ? (
              <>
                <div className="text-lg font-bold text-gray-900">₹{rate}</div>
                <div className="text-xs text-gray-600">/hr per bag</div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Rate not available</div>
            )}
          </div>
          <Button
            variant={isAvailable ? 'primary' : 'secondary'}
            size="sm"
            disabled={!isAvailable || rate == null}
            onClick={() => onBook(location)}
            className="text-xs"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}

// Booking Modal
function BookingModal({ location, open, onClose, onSuccess }) {
  const [bags, setBags] = useState(1);
  const [hours, setHours] = useState(3);
  const [dropOff, setDropOff] = useState('');
  const [bagSize, setBagSize] = useState('MEDIUM');
  const [bagType, setBagType] = useState('SUITCASE');
  const [instructions, setInstructions] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const rate = location?.provider?.hourlyRate ?? null;
  const total = rate != null ? bags * hours * rate : null;

  const pad = (n) => String(n).padStart(2, '0');
  const formatIsoForBackend = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  async function handleSubmit() {
    setSaving(true);
    setBookingError(null);
    try {
      const dropDate = dropOff ? new Date(dropOff) : new Date();
      const pickDate = new Date(dropDate.getTime() + hours * 3600 * 1000);

      const items = Array.from({ length: bags }, (_, idx) => ({
        size: bagSize,
        type: bagType,
        description: `Baggage item ${idx + 1} (${bagSize.toLowerCase()} ${bagType.toLowerCase()})`,
      }));

      const payload = {
        providerId: location.providerId,
        locationId: location.id,
        expectedDropOffTime: formatIsoForBackend(dropDate),
        expectedPickupTime: formatIsoForBackend(pickDate),
        hourlyRate: rate,
        specialInstructions: instructions.trim() || undefined,
        items,
      };

      const result = await bookingApi.create(payload, auth.userId());
      setBookingResult(result);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setBookingError(err.message || 'Failed to submit booking request.');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSubmitted(false);
    setBookingResult(null);
    setBookingError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleReset}
      title={submitted ? 'Booking request submitted' : `Book Storage at ${location?.provider?.businessName || 'Storage Hub'}`}
      description={submitted ? 'Your booking request has been submitted' : location?.address}
      footer={
        submitted ? (
          <Button variant="primary" size="md" onClick={handleReset}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSubmit} loading={saving} disabled={rate == null}>
              {rate != null ? `Confirm Booking - ₹${total}` : 'Rate unavailable'}
            </Button>
          </>
        )
      }
    >
      {submitted ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Booking Reference</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">BK-{bookingResult?.id}</p>
            <p className="text-sm text-gray-600 mt-2">Status: {bookingResult?.status || 'PENDING_APPROVAL'}</p>
          </div>
          <Alert variant="info">
            The provider has received your booking request and will confirm shortly.
          </Alert>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingError && (
            <Alert variant="danger" title="Booking Error">
              {bookingError}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Number of Bags" htmlFor="bag-count" required>
              <Select id="bag-count" value={bags} onChange={(e) => setBags(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Bag' : 'Bags'}</option>)}
              </Select>
            </FormField>

            <FormField label="Duration" htmlFor="hours-count" required>
              <Select id="hours-count" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                <option value={1}>1 Hour</option>
                <option value={2}>2 Hours</option>
                <option value={3}>3 Hours</option>
                <option value={4}>4 Hours</option>
                <option value={6}>6 Hours</option>
                <option value={8}>8 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Bag Size" htmlFor="bag-size" required>
              <Select id="bag-size" value={bagSize} onChange={(e) => setBagSize(e.target.value)}>
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="LARGE">Large</option>
                <option value="OVERSIZED">Oversized</option>
              </Select>
            </FormField>

            <FormField label="Bag Type" htmlFor="bag-type" required>
              <Select id="bag-type" value={bagType} onChange={(e) => setBagType(e.target.value)}>
                <option value="SUITCASE">Suitcase</option>
                <option value="BACKPACK">Backpack</option>
                <option value="DUFFEL">Duffel Bag</option>
                <option value="BOX">Box</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Drop-off Time" htmlFor="dropoff-time" required>
            <Input
              id="dropoff-time"
              type="datetime-local"
              value={dropOff}
              onChange={(e) => setDropOff(e.target.value)}
            />
          </FormField>

          <FormField label="Special Instructions (Optional)" htmlFor="instructions">
            <Input
              id="instructions"
              placeholder="Enter any handling instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </FormField>

          {/* Cost Summary */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
            <InfoRow label="Rate per bag/hour" value={rate != null ? `₹${rate}` : 'N/A'} />
            <InfoRow label="Duration" value={`${hours} hours`} />
            <InfoRow label="Number of bags" value={`${bags}`} />
            <div className="pt-2 border-t border-gray-300 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Estimated total</span>
              <span className="font-bold text-xl text-orange-600">{total != null ? `₹${total}` : '—'}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function SearchPage() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sortBy, setSortBy] = useState('default');

  // Get query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q') || '';

  const { data: locations, loading, error, refetch } = useFetch(() =>
    providerApi.getAllLocationsWithProviders()
  );

  const list = locations || [];

  // Filter by search query
  const filtered = list.filter((loc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (loc.address || '').toLowerCase().includes(query) ||
      (loc.provider?.businessName || '').toLowerCase().includes(query) ||
      String(loc.id).includes(query)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (a.provider?.hourlyRate || 999) - (b.provider?.hourlyRate || 999);
    } else if (sortBy === 'price-high') {
      return (b.provider?.hourlyRate || 0) - (a.provider?.hourlyRate || 0);
    }
    return 0;
  });

  return (
    <EcommerceLayout>
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {searchQuery ? `Results for "${searchQuery}"` : 'All Storage Locations'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Loading...' : `${sorted.length} locations found`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="default">Default order</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" title="Connection Error">
            {error}. Please check your connection and try again.
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="bg-white border border-gray-300 rounded p-3 h-64 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={Luggage}
            title="No storage locations found"
            description={searchQuery ? `No results for "${searchQuery}". Try a different search term.` : 'No storage locations available at this time.'}
          />
        ) : (
          /* Results Grid - Compact Amazon-style */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((loc) => (
              <StorageCard
                key={loc.id}
                location={loc}
                onBook={(selected) => setSelectedLocation(selected)}
              />
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedLocation && (
          <BookingModal
            location={selectedLocation}
            open={!!selectedLocation}
            onClose={() => setSelectedLocation(null)}
            onSuccess={() => refetch()}
          />
        )}
      </div>
    </EcommerceLayout>
  );
}
