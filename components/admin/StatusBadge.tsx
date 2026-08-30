const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  // Lead statuses
  new: { bg: 'var(--color-navy-100)', fg: 'var(--color-navy-700)' },
  contacted: { bg: 'var(--color-amber-100)', fg: 'var(--color-amber-700)' },
  interested: { bg: 'var(--color-teal-100)', fg: 'var(--color-teal-700)' },
  counselling: { bg: 'var(--color-teal-100)', fg: 'var(--color-teal-700)' },
  application_started: { bg: 'var(--color-amber-100)', fg: 'var(--color-amber-700)' },
  application_submitted: { bg: 'var(--color-navy-100)', fg: 'var(--color-navy-700)' },
  admission_offered: { bg: 'var(--color-teal-100)', fg: 'var(--color-teal-700)' },
  enrolled: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  follow_up_later: { bg: 'var(--color-amber-100)', fg: 'var(--color-amber-700)' },
  not_interested: { bg: '#F2F0F5', fg: 'var(--color-muted)' },
  unreachable: { bg: '#F2F0F5', fg: 'var(--color-muted)' },
  lost: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' },

  // Application statuses
  draft: { bg: '#F2F0F5', fg: 'var(--color-muted)' },
  submitted: { bg: 'var(--color-navy-100)', fg: 'var(--color-navy-700)' },
  under_review: { bg: 'var(--color-amber-100)', fg: 'var(--color-amber-700)' },
  accepted: { bg: 'var(--color-teal-100)', fg: 'var(--color-teal-700)' },
  rejected: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' },
  withdrawn: { bg: '#F2F0F5', fg: 'var(--color-muted)' },

  // Programme status
  active: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  inactive: { bg: '#F2F0F5', fg: 'var(--color-muted)' },

  // Follow-up statuses
  pending: { bg: 'var(--color-amber-100)', fg: 'var(--color-amber-700)' },
  completed: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)' },
  cancelled: { bg: '#F2F0F5', fg: 'var(--color-muted)' },
  overdue: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)' }
}

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors = COLOR_MAP[status] ?? { bg: 'var(--color-navy-100)', fg: 'var(--color-navy-700)' }
  return (
    <span className="status-pill" style={{ background: colors.bg, color: colors.fg }}>
      {label}
    </span>
  )
}
