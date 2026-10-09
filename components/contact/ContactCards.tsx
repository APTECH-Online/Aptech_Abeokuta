import { ArrowUpRight, Clock, Mail, MessageCircle, Phone } from 'lucide-react'
import IconTile from '../ui/IconTile'
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/whatsapp'
import { telHref } from '../../lib/seo'

type Hour = { day: string; time: string }

/**
 * Contact method cards for /contact: phone & WhatsApp, email and office hours.
 * The campus address lives with the map (OfficeMap) so it isn't repeated here.
 * Every value comes from the CRM contact_info row passed in by the page.
 */
export default function ContactCards({
  phone,
  whatsapp,
  email,
  hours
}: {
  phone: string
  whatsapp: string
  email: string
  hours: Hour[]
}) {
  const tel = telHref(phone)
  return (
    <div className="contact-grid">
      <article className="contact-card">
        <IconTile icon={Phone} tone="teal" size="md" />
        <p className="contact-kicker">Call or WhatsApp</p>
        <p className="contact-value">
          {tel ? <a href={tel}>{phone}</a> : phone}
        </p>
        <div className="contact-actions">
          {tel && (
            <a href={tel} className="contact-action">
              <Phone size={14} aria-hidden="true" /> Call
            </a>
          )}
          {whatsapp && (
            <a href={buildWhatsAppLink(whatsapp, WHATSAPP_DEFAULT_MESSAGE)} target="_blank" rel="noopener noreferrer" className="contact-action contact-action--wa">
              <MessageCircle size={14} aria-hidden="true" /> WhatsApp
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </article>

      <article className="contact-card">
        <IconTile icon={Mail} tone="navy" size="md" />
        <p className="contact-kicker">Email us</p>
        <p className="contact-value contact-value--email">
          <a href={`mailto:${email}`}>
            {email.split('@')[0]}
            <wbr />
            {email.includes('@') ? `@${email.split('@').slice(1).join('@')}` : ''}
          </a>
        </p>
        <div className="contact-actions">
          <a href={`mailto:${email}`} className="contact-action">
            Write an email <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </article>

      <article className="contact-card contact-card--wide">
        <div className="contact-card__head">
          <IconTile icon={Clock} tone="amber" size="md" />
          <p className="contact-kicker">Office hours</p>
        </div>
        <ul className="hours-list">
          {hours.map((h) => (
            <li key={h.day} className="hours-row">
              <span className="hours-day">{h.day}</span>
              <span className="hours-dots" aria-hidden="true" />
              <span className={`hours-time${/closed/i.test(h.time) ? ' is-closed' : ''}`}>{h.time}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}
