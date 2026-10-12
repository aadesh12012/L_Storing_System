import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

/* ==========================================================================
   BUTTON
   ========================================================================== */
export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon: Icon,
  children,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed active:scale-[0.99]';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-2 focus-visible:ring-blue-500 border border-transparent',
    secondary:
      'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400',
    outline:
      'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 focus-visible:ring-2 focus-visible:ring-gray-400',
    danger:
      'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-2 focus-visible:ring-red-500 border border-transparent',
    'danger-subtle':
      'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 focus-visible:ring-2 focus-visible:ring-red-400',
    success:
      'bg-green-600 hover:bg-green-700 text-white focus-visible:ring-2 focus-visible:ring-green-500 border border-transparent',
    ghost:
      'bg-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-transparent focus-visible:ring-2 focus-visible:ring-gray-400',
  };

  const sizes = {
    xs: 'text-xs px-3 py-1.5 gap-1.5 h-7',
    sm: 'text-sm px-4 py-2 gap-2 h-9',
    md: 'text-sm px-5 py-2.5 gap-2 h-10',
    lg: 'text-base px-6 py-3 gap-2.5 h-11',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant] || variants.secondary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

/* ==========================================================================
   INPUTS & FORM CONTROLS
   ========================================================================== */
export function Input({
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  error,
  className = '',
  id,
  ...props
}) {
  return (
    <div className="relative w-full">
      {LeftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <LeftIcon className="w-4 h-4" />
        </div>
      )}
      <input
        id={id}
        className={`w-full rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
          LeftIcon ? 'pl-10' : 'pl-3'
        } ${RightIcon ? 'pr-10' : 'pr-3'} py-2.5 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-blue-600 focus:ring-blue-200'
        } ${className}`}
        {...props}
      />
      {RightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <RightIcon className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

export function Select({ error, className = '', id, children, ...props }) {
  return (
    <div className="relative w-full">
      <select
        id={id}
        className={`w-full rounded-lg border bg-white py-2 pl-3.5 pr-8 text-sm text-slate-900 shadow-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none cursor-pointer ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/15'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export function Textarea({ error, className = '', id, rows = 3, ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-y ${
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
          : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/15'
      } ${className}`}
      {...props}
    />
  );
}

export function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-900">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {hint && <span className="text-sm text-gray-500">{hint}</span>}
        </div>
      )}
      {children}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

/* ==========================================================================
   BADGES & STATUS PILLS
   ========================================================================== */
export function Badge({ variant = 'neutral', dot = true, children, className = '' }) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 ring-slate-600/15',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/25',
    danger: 'bg-red-50 text-red-700 ring-red-600/20',
    brand: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    brand: 'bg-indigo-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
        variants[variant] || variants.neutral
      } ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.neutral}`}
        />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const map = {
    // Booking
    REQUESTED:        { variant: 'neutral', label: 'Requested' },
    PENDING_APPROVAL: { variant: 'warning', label: 'Pending Approval' },
    APPROVED:         { variant: 'info',    label: 'Approved' },
    ACTIVE:           { variant: 'success', label: 'Active' },
    COMPLETED:        { variant: 'success', label: 'Completed' },
    PAID:             { variant: 'success', label: 'Paid' },
    DECLINED:         { variant: 'danger',  label: 'Declined' },
    CANCELLED:        { variant: 'danger',  label: 'Cancelled' },
    // Payment
    SUCCESS:          { variant: 'success', label: 'Success (simulated)' },
    PENDING:          { variant: 'warning', label: 'Pending' },
    FAILED:           { variant: 'danger',  label: 'Failed' },
    REFUNDED:         { variant: 'neutral', label: 'Refunded' },
    // KYC
    VERIFIED:         { variant: 'success', label: 'Approved' },
    PENDING_KYC:      { variant: 'warning', label: 'Pending approval' },
    REJECTED:         { variant: 'danger',  label: 'Rejected' },
    SUSPENDED:        { variant: 'danger',  label: 'Suspended' },
    // Payout
    SCHEDULED:        { variant: 'info',    label: 'Scheduled' },
    PROCESSING:       { variant: 'warning', label: 'Processing' },
    SENT:             { variant: 'success', label: 'Sent' },
  };

  const entry = map[status] || { variant: 'neutral', label: status || '—' };
  return (
    <Badge variant={entry.variant} className={className}>
      {entry.label}
    </Badge>
  );
}

/* ==========================================================================
   CARDS
   ========================================================================== */
export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 transition-all ${
        hover ? 'hover:border-gray-300 hover:shadow-sm' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ title, subtitle, children, className = '' }) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 ${className}`}
    >
      <div>
        {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 ${className}`}
    >
      {children}
    </div>
  );
};

/* ==========================================================================
   TABLES
   ========================================================================== */
export function TableContainer({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto w-full ${className}`}>
      {children}
    </div>
  );
}

export function Table({ children, className = '' }) {
  return (
    <table className={`w-full text-left border-collapse text-sm ${className}`}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-slate-50/80 border-b border-slate-200/80 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return <tbody className={`divide-y divide-slate-100 bg-white ${className}`}>{children}</tbody>;
}

export function TableRow({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3.5 text-slate-700 align-middle ${className}`}>{children}</td>;
}

/* ==========================================================================
   STAT CARD
   ========================================================================== */
export function StatCard({
  label,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  className = '',
}) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {change && (
        <div className="mt-2 text-sm font-medium">
          {isPositive ? (
            <span className="inline-flex items-center gap-1 text-green-700">
              <TrendingUp className="w-4 h-4" />
              {change}
            </span>
          ) : isNegative ? (
            <span className="inline-flex items-center gap-1 text-red-700">
              <TrendingDown className="w-4 h-4" />
              {change}
            </span>
          ) : (
            <span className="text-gray-600">{change}</span>
          )}
        </div>
      )}
    </Card>
  );
}

/* ==========================================================================
   MODAL
   ========================================================================== */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-lg shadow-sm border border-slate-200 w-full ${maxWidth} overflow-hidden transform transition-all duration-200 scale-100`}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   ALERT
   ========================================================================== */
export function Alert({ variant = 'info', title, children, className = '' }) {
  const config = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    },
    danger: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    },
  };

  const { bg, icon } = config[variant] || config.info;

  return (
    <div className={`p-3.5 rounded-lg border flex gap-3 text-xs leading-relaxed ${bg} ${className}`}>
      {icon}
      <div className="space-y-0.5">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function PaymentSimulationNotice() {
  return (
    <Alert variant="info" title="Payment simulator">
      Payments, refunds, and payouts use a simulator here; no real money is charged or moved.
    </Alert>
  );
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */
export function EmptyState({
  icon: Icon,
  title = 'No records found',
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`text-center py-16 px-6 rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   INFO ROW (Key-Value Pair)
   ========================================================================== */
export function InfoRow({ label, value, className = '' }) {
  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-gray-200 text-sm last:border-b-0 ${className}`}
    >
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value ?? '—'}</span>
    </div>
  );
}

/* ==========================================================================
   PAGE HEADER
   ========================================================================== */
export function PageHeader({ title, subtitle, actions, children, className = '' }) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3 shrink-0">{actions || children}</div>
      )}
    </div>
  );
}

/* ==========================================================================
   FILTER BAR
   ========================================================================== */
export function FilterBar({ children, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}

/* ==========================================================================
   SKELETON LOADER
   ========================================================================== */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}
