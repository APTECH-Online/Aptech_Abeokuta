import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { ReactNode } from 'react'

type Variant = 'success' | 'error' | 'info'

const VARIANT_STYLES: Record<Variant, { bg: string; fg: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: 'var(--color-success-bg)', fg: 'var(--color-success)', Icon: CheckCircle2 },
  error: { bg: 'var(--color-danger-bg)', fg: 'var(--color-danger)', Icon: AlertCircle },
  info: { bg: 'var(--color-navy-50)', fg: 'var(--color-navy-700)', Icon: Info }
}

export default function FormAlert({
  variant,
  title,
  children
}: {
  variant: Variant
  title: string
  children?: ReactNode
}) {
  const { bg, fg, Icon } = VARIANT_STYLES[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className="rounded-xl border p-4 sm:p-5 flex items-start gap-3"
      style={{ background: bg, borderColor: 'transparent' }}
    >
      <Icon size={20} className="shrink-0 mt-0.5" style={{ color: fg }} aria-hidden="true" />
      <div>
        <p className="font-semibold text-sm" style={{ color: fg }}>{title}</p>
        {children && (
          <div className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
