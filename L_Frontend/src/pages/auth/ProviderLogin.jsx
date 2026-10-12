import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, FormField, Input } from '../../components/ui.jsx';
import { Mail, Lock, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Provider Login — uses the same real backend authentication endpoint as the
 * traveller login (the User Service issues one JWT type for every account),
 * then checks the account's real Provider record via
 *   GET /api/v1/providers/user/{userId}
 * A "Provider" is never a locally toggled label — it only exists if the
 * Provider Service actually has a matching row for this user.
 */
export default function ProviderLogin() {
  const { login, sessionMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [noProviderProfile, setNoProviderProfile] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setNoProviderProfile(false);
    clearSessionMessage();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { providerProfile, profile } = await login({ email, password });
      if (profile.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (providerProfile) {
        navigate('/provider/dashboard', { replace: true });
      } else {
        // Authenticated successfully, but no real Provider record exists yet.
        setNoProviderProfile(true);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 400) {
        setError(err.message || 'Invalid email or password.');
      } else if (err.status >= 500) {
        setError('The server encountered an error. Please try again shortly.');
      } else if (!err.status) {
        setError('Could not reach the API Gateway. Check your connection and try again.');
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Storage partner sign in"
      subtitle="Manage your locations, bookings, and payouts."
      badge="Provider"
      footer={
        <>
          New storage partner?{' '}
          <Link to="/provider/register" className="font-semibold text-blue-700 hover:underline">
            Register your business
          </Link>
          <div className="mt-2">
            Looking for the traveller app?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">
              User sign in
            </Link>
          </div>
        </>
      }
    >
      {sessionMessage && (
        <Alert variant="warning" title="Sign-in required" className="mb-4">
          {sessionMessage}
        </Alert>
      )}

      {noProviderProfile && (
        <Alert variant="warning" title="No storage provider profile found" className="mb-4">
          You are signed in, but this account has no registered storage provider profile yet.
          <div className="flex gap-3 mt-3">
            <Button variant="primary" size="sm" onClick={() => navigate('/provider/register', { replace: true })}>
              Register as a provider
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/user/dashboard', { replace: true })}>
              Continue as traveller
            </Button>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <Alert variant="danger" title="Sign-in failed">
            {error}
          </Alert>
        )}

        <FormField label="Email address" htmlFor="p-login-email" required error={fieldErrors.email}>
          <Input
            id="p-login-email"
            type="email"
            autoComplete="email"
            leftIcon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
          />
        </FormField>

        <FormField label="Password" htmlFor="p-login-password" required error={fieldErrors.password}>
          <Input
            id="p-login-password"
            type="password"
            autoComplete="current-password"
            leftIcon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormField>

        <Button type="submit" variant="primary" size="lg" className="w-full" icon={Store} loading={submitting}>
          Sign in as provider
        </Button>
      </form>
    </AuthLayout>
  );
}
