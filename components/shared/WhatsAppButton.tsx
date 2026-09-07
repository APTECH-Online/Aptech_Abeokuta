import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/whatsapp'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost'
}

export default function WhatsAppButton({
  message = WHATSAPP_DEFAULT_MESSAGE,
  label = 'Chat with Admissions',
  variant = 'secondary',
  className = '',
  showIcon = true
}: {
  message?: string
  label?: string
  variant?: Variant
  className?: string
  showIcon?: boolean
}) {
  return (
    <a
      href={buildWhatsAppLink(message)}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`${VARIANT_CLASS[variant]} inline-flex items-center justify-center gap-2 ${className}`}
    >
      {showIcon && <MessageCircle size={16} aria-hidden="true" />}
      {label}
    </a>
  )
}
