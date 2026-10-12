/**
 * api.js — Central API client for Luggo.
 *
 * All frontend requests route strictly through the configured API Gateway:
 *   Frontend → configured API Gateway → Microservices → Database
 *
 * The API base URL is configured through import.meta.env.VITE_API_BASE_URL.
 * No mock, hardcoded, or locally simulated data is used.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// API Gateway Base URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

// ── Auth & Session Storage ───────────────────────────────────────────────────
//
// The User Service's /api/v1/auth/login endpoint returns only a signed JWT
// (accessToken, tokenType, expiresInMs) — it does NOT return a user object.
// The JWT payload itself carries the real, backend-issued claims we can trust
// without another round-trip: subject (user id), email, role, exp.
// A fuller profile (name, phone, kycStatus, isActive) is fetched separately via
// GET /api/v1/users/{id} and cached alongside the token — never invented.

const TOKEN_KEY = 'ls_token';
const EXPIRY_KEY = 'ls_token_expiry';
const PROFILE_KEY = 'ls_profile';
const PROVIDER_KEY = 'ls_provider_profile';

/** Decodes a JWT payload (base64url) without verifying the signature.
 *  Signature verification always happens server-side (Gateway + services);
 *  this is only used client-side to read the non-secret claims for routing. */
export function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const auth = {
  /** Persist the JWT returned by /api/v1/auth/login. */
  saveToken(accessToken, expiresInMs) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (expiresInMs) {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + Number(expiresInMs)));
    } else {
      localStorage.removeItem(EXPIRY_KEY);
    }
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROVIDER_KEY);
  },
  /** Persist the real profile fetched from GET /api/v1/users/{id}. */
  saveProfile(profile) {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },
  /** Persist the real provider record (if this account also has one) fetched
   *  from GET /api/v1/providers/user/{userId}. */
  saveProviderProfile(providerProfile) {
    if (providerProfile) localStorage.setItem(PROVIDER_KEY, JSON.stringify(providerProfile));
    else localStorage.removeItem(PROVIDER_KEY);
  },
  /** Remove the entire auth session (logout). */
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PROVIDER_KEY);
  },
  /** Retrieve the raw JWT. */
  token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  /** True once the stored token's expiry timestamp has passed. */
  isExpired() {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (expiry && Number.isFinite(Number(expiry))) return Date.now() >= Number(expiry);
    const jwtExpiry = Number(auth.claims()?.exp);
    return Number.isFinite(jwtExpiry) && jwtExpiry > 0 && Date.now() >= jwtExpiry * 1000;
  },
  /** Decoded JWT claims (id, email, role, exp) or null. */
  claims() {
    return decodeJwt(auth.token());
  },
  /** Cached profile from GET /api/v1/users/{id}, or null. */
  user() {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  /** Cached provider record from GET /api/v1/providers/user/{userId}, or null. */
  providerProfile() {
    const raw = localStorage.getItem(PROVIDER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  /** Real numeric user ID, sourced from the JWT subject claim. */
  userId() {
    const claims = auth.claims();
    return claims?.sub ? Number(claims.sub) : (auth.user()?.id ?? null);
  },
  /** Real role claim issued by the User Service ("USER" | "ADMIN" — see note
   *  in AuthContext.jsx about the backend not exposing a "PROVIDER" role). */
  role() {
    return auth.claims()?.role ?? auth.user()?.role ?? null;
  },
  /** Real provider ID, only present once a Provider profile has been resolved. */
  providerId() {
    return auth.providerProfile()?.id ?? null;
  },
  /** True while a non-expired token is present. */
  loggedIn() {
    return !!auth.token() && !auth.isExpired();
  },
};

// ── HTTP Request Dispatcher through API Gateway ──────────────────────────────

/**
 * Executes an HTTP request through the API Gateway.
 *
 * @param {string} path - path starting with /api/v1/...
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('API Gateway is not configured. Set VITE_API_BASE_URL and restart the frontend.');
  }

  const token = auth.token();

  const url = `${API_BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(auth.userId() ? { 'X-User-Id': String(auth.userId()) } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(url, { ...options, headers });

  // A 401 while we believe we hold a session means the token expired or was
  // revoked server-side. Notify AuthContext so it can clear state and route
  // the user back to a login screen instead of silently pretending to be
  // authenticated.
  if (res.status === 401 && token) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  if (res.status === 204) {
    return null;
  }

  const responseText = await res.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (res.ok) {
        throw new Error('The API Gateway returned an invalid response. Please try again.');
      }
    }
  }

  if (!res.ok) {
    const fieldErrors = data?.fieldErrors;
    const fieldErrorMessage =
      fieldErrors && typeof fieldErrors === 'object'
        ? Object.entries(fieldErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('; ')
        : null;
    const errorMsg =
      data?.message ||
      fieldErrorMessage ||
      data?.error ||
      `Request to API Gateway failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

const get = (path, query) => {
  const q = query ? `?${new URLSearchParams(query).toString()}` : '';
  return request(`${path}${q}`, { method: 'GET' });
};

const post = (path, body, query) => {
  const q = query ? `?${new URLSearchParams(query).toString()}` : '';
  return request(`${path}${q}`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
};

const put = (path, body, query) => {
  const q = query ? `?${new URLSearchParams(query).toString()}` : '';
  return request(`${path}${q}`, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
};

const patch = (path, body, query) => {
  const q = query ? `?${new URLSearchParams(query).toString()}` : '';
  return request(`${path}${q}`, {
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const del = (path, query) => {
  const q = query ? `?${new URLSearchParams(query).toString()}` : '';
  return request(`${path}${q}`, { method: 'DELETE' });
};

// ── 1. User & Authentication Service (via Gateway /api/v1/auth & /api/v1/users) ──

export const userApi = {
  /** Register new account: POST /api/v1/auth/register */
  register: (data) => post('/api/v1/auth/register', data),

  /** Login account: POST /api/v1/auth/login
   *  Returns the raw AuthResponse { accessToken, tokenType, expiresInMs }.
   *  The User Service does not return a user object here, so session
   *  bootstrapping (decoding the JWT, fetching the real profile, resolving
   *  any linked Provider profile) is orchestrated by AuthContext. */
  login: (data) => post('/api/v1/auth/login', data),

  /** Get user profile: GET /api/v1/users/{id} */
  getProfile: (id) => get(`/api/v1/users/${id}`),

  /** Update profile: PUT /api/v1/users/{id} */
  updateProfile: (id, data) => put(`/api/v1/users/${id}`, data),

  /** Admin: List all users: GET /api/v1/users */
  listAllUsers: () => get('/api/v1/users'),

  /** Admin: Set user active status: PATCH /api/v1/users/{id}/status?active={true/false} */
  setStatus: (id, active) =>
    patch(`/api/v1/users/${id}/status`, undefined, { active }),
};

// ── 2. Provider Service (via Gateway /api/v1/providers) ───────────────────────

export const providerApi = {
  /** Register provider: POST /api/v1/providers?userId={userId} */
  register: (userId, data) => post('/api/v1/providers', data, { userId }),

  /** Get provider details by ID: GET /api/v1/providers/{id} */
  getById: (id) => get(`/api/v1/providers/${id}`),

  /** Get provider details by User ID: GET /api/v1/providers/user/{userId} */
  getByUserId: (userId) => get(`/api/v1/providers/user/${userId}`),

  /** Update provider: PUT /api/v1/providers/{id} */
  update: (id, data) => put(`/api/v1/providers/${id}`, data),

  /** Admin: List pending KYC submissions: GET /api/v1/providers/kyc/pending */
  listPendingKyc: () => get('/api/v1/providers/kyc/pending'),

  /** Admin: Update provider KYC status: PATCH /api/v1/providers/{id}/kyc?status={status} */
  updateKyc: (id, status) => patch(`/api/v1/providers/${id}/kyc`, undefined, { status }),

  /** Admin: Set provider active status: PATCH /api/v1/providers/{id}/status?active={active} */
  setStatus: (id, active) => patch(`/api/v1/providers/${id}/status`, undefined, { active }),

  // ── Storage Locations (P-3) ──
  /** Add storage location: POST /api/v1/providers/{providerId}/locations */
  addLocation: (providerId, data) => post(`/api/v1/providers/${providerId}/locations`, data),

  /** List provider's storage locations: GET /api/v1/providers/{providerId}/locations */
  getLocations: (providerId) => get(`/api/v1/providers/${providerId}/locations`),

  /** List all available locations (Marketplace search): GET /api/v1/providers/locations */
  getAllLocations: () => get('/api/v1/providers/locations'),

  /** Get location by ID: GET /api/v1/providers/locations/{locationId} */
  getLocation: (locationId) => get(`/api/v1/providers/locations/${locationId}`),

  /** Update location: PUT /api/v1/providers/locations/{locationId} */
  updateLocation: (locationId, data) => put(`/api/v1/providers/locations/${locationId}`, data),

  /** Set location availability: PATCH /api/v1/providers/locations/{locationId}/status?available={bool} */
  setLocationAvailability: (id, available) =>
    patch(`/api/v1/providers/locations/${id}/status`, undefined, { available }),

  /** Delete location: DELETE /api/v1/providers/locations/{locationId} */
  deleteLocation: (locationId) => del(`/api/v1/providers/locations/${locationId}`),

  /**
   * Composite read used by SearchPage and AdminProviders.
   *
   * StorageLocationResponse only carries address/coordinates/hours/
   * availability — it has no businessName, hourlyRate, or rating (those
   * belong to the Provider entity). There is no single backend endpoint that
   * joins the two, so this performs the join client-side out of two real
   * endpoints (GET /api/v1/providers/locations + GET /api/v1/providers/{id})
   * rather than inventing owner names, ratings, or prices that don't exist.
   */
  async getAllLocationsWithProviders() {
    const locations = await get('/api/v1/providers/locations');
    const uniqueProviderIds = [...new Set((locations ?? []).map((l) => l.providerId).filter(Boolean))];
    const providers = await Promise.all(uniqueProviderIds.map((id) => get(`/api/v1/providers/${id}`)));
    const providerMap = new Map(uniqueProviderIds.map((id, idx) => [id, providers[idx]]));
    return (locations ?? []).map((loc) => ({ ...loc, provider: providerMap.get(loc.providerId) ?? null }));
  },
};

// ── 3. Booking Service (via Gateway /api/v1/bookings) ─────────────────────────

export const bookingApi = {
  /** Create booking request: POST /api/v1/bookings?userId={userId} */
  create: (data, userId) => {
    const uid = userId ?? auth.userId();
    return post('/api/v1/bookings', data, { userId: uid });
  },

  /** Get booking by ID: GET /api/v1/bookings/{id} */
  getById: (id) => get(`/api/v1/bookings/${id}`),

  /** Get bookings by user: GET /api/v1/bookings/user/{userId} */
  getByUser: (userId) => {
    const uid = userId ?? auth.userId();
    return get(`/api/v1/bookings/user/${uid}`);
  },

  /** Get bookings by provider: GET /api/v1/bookings/provider/{providerId} */
  getByProvider: (providerId, status) => {
    const query = status ? { status } : undefined;
    return get(`/api/v1/bookings/provider/${providerId}`, query);
  },

  /** Admin: List all platform bookings: GET /api/v1/bookings */
  getAll: (status) => {
    const query = status ? { status } : undefined;
    return get('/api/v1/bookings', query);
  },

  /** Provider approve booking: PATCH /api/v1/bookings/{id}/approve?providerId={providerId} */
  approve: (id, providerId) =>
    patch(`/api/v1/bookings/${id}/approve`, undefined, { providerId }),

  /** Provider decline booking: PATCH /api/v1/bookings/{id}/decline?providerId={providerId}&reason={reason} */
  decline: (id, providerId, reason) =>
    patch(`/api/v1/bookings/${id}/decline`, undefined, {
      providerId,
      ...(reason ? { reason } : {}),
    }),

  /** Provider check in luggage: PATCH /api/v1/bookings/{id}/check-in?providerId={providerId} */
  checkIn: (id, providerId) =>
    patch(`/api/v1/bookings/${id}/check-in`, undefined, { providerId }),

  /** Provider check out luggage: PATCH /api/v1/bookings/{id}/check-out?providerId={providerId} */
  checkOut: (id, providerId) =>
    patch(`/api/v1/bookings/${id}/check-out`, undefined, { providerId }),

  /** User or Admin cancel booking: PATCH /api/v1/bookings/{id}/cancel */
  cancel: (id, requesterId, reason, isAdmin = false) => {
    const reqId = requesterId ?? auth.userId();
    return patch(`/api/v1/bookings/${id}/cancel`, undefined, {
      requesterId: reqId,
      ...(reason ? { reason } : {}),
      isAdmin: String(!!isAdmin),
    });
  },

  /** Real-time cost estimate: GET /api/v1/bookings/{id}/cost-estimate */
  getCostEstimate: (id) => get(`/api/v1/bookings/${id}/cost-estimate`),
};

// ── 4. Payment Service (via Gateway /api/v1/payments) ─────────────────────────

export const paymentApi = {
  /** Process charge: POST /api/v1/payments/charge */
  charge: (data) => post('/api/v1/payments/charge', data),

  /** Get payment by ID: GET /api/v1/payments/{paymentId} */
  getById: (paymentId) => get(`/api/v1/payments/${paymentId}`),

  /** Get payment by booking ID: GET /api/v1/payments/booking/{bookingId} */
  getByBooking: (bookingId) => get(`/api/v1/payments/booking/${bookingId}`),

  /** Get user payment history: GET /api/v1/payments/user/{userId} */
  getByUser: (userId) => {
    const uid = userId ?? auth.userId();
    return get(`/api/v1/payments/user/${uid}`);
  },

  /** Get provider payments: GET /api/v1/payments/provider/{providerId} */
  getByProvider: (providerId) => get(`/api/v1/payments/provider/${providerId}`),

  // ── Provider Payouts & Earnings (P-9, P-10) ──
  /** Get provider earnings: GET /api/v1/payments/provider/{providerId}/earnings */
  getEarnings: (providerId) => get(`/api/v1/payments/provider/${providerId}/earnings`),

  /** Request payout: POST /api/v1/payments/provider/{providerId}/payouts */
  requestPayout: (providerId, data) => post(`/api/v1/payments/provider/${providerId}/payouts`, data),

  /** Get provider payout history: GET /api/v1/payments/provider/{providerId}/payouts */
  getPayouts: (providerId) => get(`/api/v1/payments/provider/${providerId}/payouts`),

  // ── Admin Payment & Commission Management (A-4, A-5, A-8) ──
  /** Admin refund payment: POST /api/v1/payments/admin/{paymentId}/refund */
  refund: (paymentId, data) => post(`/api/v1/payments/admin/${paymentId}/refund`, data),

  /** Admin view commission config: GET /api/v1/payments/admin/commission */
  getCommission: () => get('/api/v1/payments/admin/commission'),

  /** Admin update commission config: PUT /api/v1/payments/admin/commission */
  updateCommission: (data) => put('/api/v1/payments/admin/commission', data),

  /** Admin view GMV & transaction stats: GET /api/v1/payments/admin/stats */
  getPlatformStats: () => get('/api/v1/payments/admin/stats'),

  /** Admin view all payments: GET /api/v1/payments/admin/all */
  getAllPayments: () => get('/api/v1/payments/admin/all'),

  /** Admin view all payouts: GET /api/v1/payments/admin/payouts */
  getAllPayouts: () => get('/api/v1/payments/admin/payouts'),
};

// ── Reusable Data Fetching Hook ──────────────────────────────────────────────

export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  const depsRef = useRef(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch data from API Gateway');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      depsRef.current &&
      depsRef.current.length === deps.length &&
      depsRef.current.every((value, index) => Object.is(value, deps[index]))
    ) {
      return;
    }
    depsRef.current = [...deps];
    load();
  });

  return { data, loading, error, refetch: load };
}
