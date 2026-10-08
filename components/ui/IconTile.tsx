import type { LucideIcon } from 'lucide-react'

/** Shared tinted icon container (Programme Finder, FAQ, and other premium cards). */
export default function IconTile({ icon: Icon, tone = 'navy', size = 'md', className = '' }: { icon: LucideIcon; tone?: 'navy' | 'teal' | 'amber'; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const px = size === 'sm' ? 16 : size === 'lg' ? 22 : 19
  return <span className={`icon-tile icon-tile--${tone} icon-tile--${size} ${className}`.trim()} aria-hidden="true"><Icon size={px} strokeWidth={1.9} /></span>
}
