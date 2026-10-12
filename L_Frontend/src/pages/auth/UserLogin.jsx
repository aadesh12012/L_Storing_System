import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, FormField, Input } from '../../components/ui.jsx';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * User Login — authenticates against the real backend:
 *   Frontend → API Gateway → User Service → Database
 * No credential is ever accepted as valid without a successful
 * POST /api/v1/auth/login response from the Gateway.
 */
export default function UserLogin() {
  const { login, sessionMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
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
    clearSessionMessage();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { providerProfile, profile } = await login({ email, password });
      const dest = location.state?.from?.pathname;
      if (dest && dest !== '/login') {
        navigate(dest, { replace: true });
      } else if (profile.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (providerProfile) {
        navigate('/provider/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.status === 401 || err.status === 400) {
        setError(err.message || 'Invalid email or password.');
      } else if (err.status === 403) {
        setError('This account is not permitted to sign in. Contact support.');
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
      title="Sign in to your account"
      subtitle="Search storage, manage bookings, and view payments."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-blue-700 hover:underline">
            Create a traveller account
          </Link>
          <div className="mt-2">
            Storage partner?{' '}
            <Link to="/provider/login" className="font-semibold text-blue-700 hover:underline">
              Provider sign in
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <Alert variant="danger" title="Sign-in failed">
            {error}
          </Alert>
        )}

        <FormField label="Email address" htmlFor="login-email" required error={fieldErrors.email}>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            leftIcon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password" required error={fieldErrors.password}>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            leftIcon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormField>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
