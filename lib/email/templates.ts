export function applicantAcknowledgementEmail(params: {
  firstName: string
  leadReference: string
  programmeName: string
}) {
  const { firstName, leadReference, programmeName } = params
  const subject = `We've received your enquiry — ${leadReference}`
  const text = [
    `Hi ${firstName},`,
    '',
    `Thank you for your interest in APTECH Abeokuta. Your enquiry for the ${programmeName} programme has been received successfully.`,
    '',
    `Your reference number is ${leadReference} — please keep this for your records.`,
    '',
    'Our admissions team will contact you shortly to guide you through next steps.',
    '',
    'Warm regards,',
    'APTECH Abeokuta Admissions Team'
  ].join('\n')

  const html = `
    <div style="font-family: sans-serif; color: #1B1626; line-height: 1.6;">
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thank you for your interest in <strong>APTECH Abeokuta</strong>. Your enquiry for the
      <strong>${escapeHtml(programmeName)}</strong> programme has been received successfully.</p>
      <p>Your reference number is <strong>${escapeHtml(leadReference)}</strong> — please keep this for your records.</p>
      <p>Our admissions team will contact you shortly to guide you through next steps.</p>
      <p>Warm regards,<br />APTECH Abeokuta Admissions Team</p>
    </div>
  `

  return { subject, text, html }
}

export function adminNewLeadNotificationEmail(params: {
  fullName: string
  email: string
  phone: string
  programmeName: string
  source: string
  leadReference: string
  isDuplicate: boolean
}) {
  const { fullName, email, phone, programmeName, source, leadReference, isDuplicate } = params
  const subject = `${isDuplicate ? '[Repeat enquiry] ' : ''}New admissions enquiry — ${leadReference}`
  const text = [
    `${isDuplicate ? 'A returning contact submitted another enquiry.' : 'A new enquiry was submitted on the website.'}`,
    '',
    `Reference: ${leadReference}`,
    `Name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Programme: ${programmeName}`,
    `Source: ${source}`
  ].join('\n')

  const html = `
    <div style="font-family: sans-serif; color: #1B1626; line-height: 1.6;">
      <p>${isDuplicate ? 'A <strong>returning contact</strong> submitted another enquiry.' : 'A new enquiry was submitted on the website.'}</p>
      <table cellpadding="4">
        <tr><td><strong>Reference</strong></td><td>${escapeHtml(leadReference)}</td></tr>
        <tr><td><strong>Name</strong></td><td>${escapeHtml(fullName)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)}</td></tr>
        <tr><td><strong>Programme</strong></td><td>${escapeHtml(programmeName)}</td></tr>
        <tr><td><strong>Source</strong></td><td>${escapeHtml(source)}</td></tr>
      </table>
    </div>
  `

  return { subject, text, html }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
