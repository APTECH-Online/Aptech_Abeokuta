import { requireStaff, canManageContactInfo } from '../../../../../lib/auth'
import { getContactInfo } from '../../../../../lib/crm/contact-info'
import ContactInfoForm from '../../../../../components/admin/ContactInfoForm'

export const metadata = { title: 'Contact info | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function ContactInfoSettingsPage() {
  const staff = await requireStaff()
  const canManage = canManageContactInfo(staff)
  const contactInfo = await getContactInfo()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content</p>
        <h1 className="h-section mt-1">Contact info</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Phone, WhatsApp, email, campus address, and office hours — shown in the site footer, the Contact
          page, every "Chat on WhatsApp" button, and the site's search-engine listing.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        {canManage ? (
          <ContactInfoForm contactInfo={contactInfo} />
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            You have read-only access to this section. Ask a Super Admin for Content Manager access to edit.
          </p>
        )}
      </div>
    </div>
  )
}
