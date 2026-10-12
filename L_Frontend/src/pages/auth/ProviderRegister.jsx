import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout.jsx';
import { Alert, Button, FormField, Input } from '../../components/ui.jsx';
import { User, Mail, Phone, Lock, Store, DollarSign, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Provider Registration — a genuine two-step backend flow, exactly as the
 * Provider Service requires (there is no combined endpoint):
 *   1. POST /api/v1/auth/register   → creates the underlying User account
 *   2. POST /api/v1/providers       → creates the linked Provider profile
 *      (requires the new account's real userId, obtained by signing in)
 * Every field submitted matches the real RegisterRequest / ProviderRequest
 * DTOs — nothing is invented client-side.
 */
export default function ProviderRegister() {
  const { registerProvider } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    businessName: '',
    hourlyRate: '',
    capacity: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Owner name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (form.phone && (form.phone.length < 10 || form.phone.length > 15)) {
      errs.phone = 'Phone must be 10-15 digits';
    }
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';

    if (!form.businessName.trim()) errs.businessName = 'Business name is required';
    const rate = Number(form.hourlyRate);
    if (!form.hourlyRate || Number.isNaN(rate) || rate <= 0) {
      errs.hourlyRate = 'Enter a positive hourly rate';
    }
    const cap = Number(form.capacity);
    if (!form.capacity || !Number.isInteger(cap) || cap < 1) {
      errs.capacity = 'Enter a whole-number capacity of at least 1';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await registerProvider({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        businessName: form.businessName,
        hourlyRate: Number(form.hourlyRate),
        capacity: Number(form.capacity),
      });
      navigate('/provider/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Provider registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Register your storage business"
      subtitle="Creates your account and storage provider profile on the platform."
      badge="Provider"
      footer={
        <>
          Already a partner?{' '}
          <Link to="/provider/login" className="font-semibold text-blue-700 hover:underline">
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

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Owner account</p>

        <FormField label="Owner full name" htmlFor="p-reg-name" required error={fieldErrors.name}>
          <Input
            id="p-reg-name"
            leftIcon={User}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Full name"
          />
        </FormField>

        <FormField label="Email address" htmlFor="p-reg-email" required error={fieldErrors.email}>
          <Input
            id="p-reg-email"
            type="email"
            autoComplete="email"
            leftIcon={Mail}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="Email address"
          />
        </FormField>

        <FormField label="Phone number" htmlFor="p-reg-phone" hint="Optional" error={fieldErrors.phone}>
          <Input
            id="p-reg-phone"
            leftIcon={Phone}
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Phone number"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Password" htmlFor="p-reg-password" required error={fieldErrors.password}>
            <Input
              id="p-reg-password"
              type="password"
              autoComplete="new-password"
              leftIcon={Lock}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 8 characters"
            />
          </FormField>

          <FormField label="Confirm password" htmlFor="p-reg-confirm" required error={fieldErrors.confirm}>
            <Input
              id="p-reg-confirm"
              type="password"
              autoComplete="new-password"
              leftIcon={Lock}
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
              placeholder="Re-enter your password"
            />
          </FormField>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 pt-2">
          Storage business profile
        </p>

        <FormField label="Business name" htmlFor="p-reg-biz" required error={fieldErrors.businessName}>
          <Input
            id="p-reg-biz"
            leftIcon={Store}
            value={form.businessName}
            onChange={(e) => update('businessName', e.target.value)}
            placeholder="Business name"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Hourly rate (₹)" htmlFor="p-reg-rate" required error={fieldErrors.hourlyRate}>
            <Input
              id="p-reg-rate"
              type="number"
              step="0.01"
              min="0.01"
              leftIcon={DollarSign}
              value={form.hourlyRate}
              onChange={(e) => update('hourlyRate', e.target.value)}
            />
          </FormField>

          <FormField label="Bag capacity" htmlFor="p-reg-capacity" required error={fieldErrors.capacity}>
            <Input
              id="p-reg-capacity"
              type="number"
              min="1"
              step="1"
              leftIcon={Package}
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
            />
          </FormField>
        </div>

        <Alert variant="info" title="Provider approval">
          Your provider profile starts with <strong>PENDING</strong> status. An administrator can
          approve or reject the profile.
        </Alert>

        <Button type="submit" variant="primary" size="lg" className="w-full" icon={Store} loading={submitting}>
          Create provider account
        </Button>
      </form>
    </AuthLayout>
  );
}
