import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, FormField, Input } from '../../components/ui.jsx';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * User Registration — creates a real account via
 *   Frontend → API Gateway → User Service → Database
 * then signs the new account in immediately using the same credentials
 * (there is no separate "registration success" screen that isn't backed by
 * an actual 201 Created response from the User Service).
 */
export default function UserRegister() {
  const { registerUser, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.length > 100) errs.name = 'Name must be 100 characters or fewer';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address';

    if (form.phone && (form.phone.length < 10 || form.phone.length > 15)) {
      errs.phone = 'Phone must be 10-15 digits';
    }

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';

    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      await login({ email: form.email, password: form.password });
      navigate('/user/dashboard', { replace: true });
    } catch (err) {
      if (err.status === 400 && err.data) {
        // Surface real backend field validation errors (e.g. duplicate email).
        setError(err.message || 'Please correct the highlighted fields.');
      } else if (!err.status) {
        setError('Could not reach the API Gateway. Check your connection and try again.');
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your traveller account"
      subtitle="Register with the User Service to start booking storage."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <Alert variant="danger" title="Registration failed">
            {error}
          </Alert>
        )}

        <FormField label="Full name" htmlFor="reg-name" required error={fieldErrors.name}>
          <Input
            id="reg-name"
            leftIcon={User}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Full name"
          />
        </FormField>

        <FormField label="Email address" htmlFor="reg-email" required error={fieldErrors.email}>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            leftIcon={Mail}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="Email address"
          />
        </FormField>

        <FormField label="Phone number" htmlFor="reg-phone" hint="Optional" error={fieldErrors.phone}>
          <Input
            id="reg-phone"
            leftIcon={Phone}
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Phone number"
          />
        </FormField>

        <FormField label="Password" htmlFor="reg-password" required error={fieldErrors.password}>
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            leftIcon={Lock}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="At least 8 characters"
          />
        </FormField>

        <FormField label="Confirm password" htmlFor="reg-confirm" required error={fieldErrors.confirm}>
          <Input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            leftIcon={Lock}
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            placeholder="Re-enter your password"
          />
        </FormField>

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
