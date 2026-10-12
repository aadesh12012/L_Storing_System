/**
 * AuthContext.jsx — Real, backend-driven authentication session state.
 *
 * This is the single source of truth for "who is logged in" across the app.
 * It never fabricates a session: a user is only ever considered authenticated
 * after the User Service confirms credentials and issues a JWT, and every
 * piece of identity data shown in the UI (name, email, role, provider profile)
 * is fetched from the real backend — nothing is hardcoded or guessed.
 *
 * Backend note (see REQUIREMENTS.md "User and Provider Roles"): the User
 * Service only ever assigns the "USER" role at registration time; there is no
 * endpoint to promote an account to "PROVIDER" (that would need to be seeded
 * directly in the database, same as ADMIN accounts). Because of that, whether
 * an authenticated account acts as a "Provider" is derived from whether a real
 * Provider record exists for it (GET /api/v1/providers/user/{userId}) rather
 * than from the JWT's role claim — this is real backend data, not a
 * client-side toggle.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth, userApi, providerApi } from '../api.js';

const AuthContext = createContext(null);

async function getOptionalProviderProfile(userId) {
  try {
    return await providerApi.getByUserId(userId);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

/** Loads the profile (+ provider profile, if any) for the currently stored
 *  token. Returns null if there is no valid session. */
async function bootstrapFromStoredToken() {
  if (!auth.loggedIn()) {
    auth.clear();
    return null;
  }
  const claims = auth.claims();
  const userId = claims?.sub ? Number(claims.sub) : null;
  if (!userId) {
    auth.clear();
    return null;
  }

  const profile = await userApi.getProfile(userId);
  auth.saveProfile(profile);

  const providerProfile = await getOptionalProviderProfile(userId);
  auth.saveProviderProfile(providerProfile);

  return { profile, providerProfile };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sessionMessage, setSessionMessage] = useState(null);

  const resetSession = useCallback(() => {
    auth.clear();
    setUser(null);
    setProviderProfile(null);
  }, []);

  // Bootstrap the session from a previously stored (still valid) token on load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await bootstrapFromStoredToken();
        if (cancelled) return;
        if (result) {
          setUser(result.profile);
          setProviderProfile(result.providerProfile);
        } else {
          resetSession();
        }
      } catch (error) {
        if (!cancelled) {
          resetSession();
          setSessionMessage(
            error.status === 401
              ? 'Your session has expired. Please sign in again.'
              : 'We could not verify your saved session with the server. Please sign in again.'
          );
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any 401 from the API Gateway on an authenticated request means the token
  // expired or was revoked server-side — force a real logout, don't pretend.
  useEffect(() => {
    function handleUnauthorized() {
      resetSession();
      setSessionMessage('Your session has expired. Please sign in again.');
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [resetSession]);

  const login = useCallback(async ({ email, password }) => {
    const authResponse = await userApi.login({ email, password });
    auth.saveToken(authResponse.accessToken, authResponse.expiresInMs);

    const claims = auth.claims();
    const userId = claims?.sub ? Number(claims.sub) : null;
    if (!userId) {
      auth.clear();
      throw new Error('Login succeeded but the session token was invalid.');
    }

    try {
      const profile = await userApi.getProfile(userId);
      auth.saveProfile(profile);

      const resolvedProviderProfile = await getOptionalProviderProfile(userId);
      auth.saveProviderProfile(resolvedProviderProfile);

      setUser(profile);
      setProviderProfile(resolvedProviderProfile);
      setSessionMessage(null);
      return { profile, providerProfile: resolvedProviderProfile };
    } catch (error) {
      auth.clear();
      throw error;
    }
  }, []);

  const registerUser = useCallback(async ({ name, email, phone, password }) => {
    return userApi.register({ name, email, phone, password });
  }, []);

  /** Composite flow: create the underlying User account, sign in, then create
   *  the linked Provider profile. All three calls are real backend requests;
   *  if the Provider step fails after account creation succeeds, the caller
   *  is told exactly that instead of the UI silently treating them as one. */
  const registerProvider = useCallback(
    async ({ name, email, phone, password, businessName, hourlyRate, capacity }) => {
      await userApi.register({ name, email, phone, password });

      let loginResult;
      try {
        loginResult = await login({ email, password });
      } catch (err) {
        throw new Error(
          'Account was created, but automatic sign-in failed: ' +
            (err.message || 'unknown error') +
            '. Please sign in manually to finish provider registration.'
        );
      }

      try {
        const created = await providerApi.register(loginResult.profile.id, {
          businessName,
          hourlyRate,
          capacity,
        });
        auth.saveProviderProfile(created);
        setProviderProfile(created);
        return { profile: loginResult.profile, providerProfile: created };
      } catch (err) {
        throw new Error(
          'Your account was created and you are signed in, but the storage provider ' +
            'profile could not be created: ' +
            (err.message || 'unknown error') +
            '. You can retry from the Provider Registration page.'
        );
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    resetSession();
  }, [resetSession]);

  const refreshProviderProfile = useCallback(async () => {
    if (!user) return null;
    try {
      const p = await providerApi.getByUserId(user.id);
      auth.saveProviderProfile(p);
      setProviderProfile(p);
      return p;
    } catch (error) {
      if (error.status !== 404) throw error;
      auth.saveProviderProfile(null);
      setProviderProfile(null);
      return null;
    }
  }, [user]);

  const value = useMemo(() => {
    const role = user?.role ?? null;
    const isAdmin = role === 'ADMIN';
    const isProvider = !!providerProfile;
    return {
      user,
      role,
      providerProfile,
      providerId: providerProfile?.id ?? null,
      isAuthenticated: !!user,
      isAdmin,
      isProvider,
      bootstrapping,
      sessionMessage,
      clearSessionMessage: () => setSessionMessage(null),
      login,
      registerUser,
      registerProvider,
      logout,
      refreshProviderProfile,
    };
  }, [
    user,
    providerProfile,
    bootstrapping,
    sessionMessage,
    login,
    registerUser,
    registerProvider,
    logout,
    refreshProviderProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Shared context hook intentionally colocated with its Provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
