import { siteConfig } from '../../data/site'

export const metadata = {
  title: 'Contact — APTECH Abeokuta',
  description: 'Contact information and enquiry form.'
}

export default function Contact() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">Contact</h1>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-muted">Phone: {siteConfig.phone || 'Placeholder'}</p>
          <p className="mt-2">Email: {siteConfig.email || 'info@example.com'}</p>
          <p className="mt-2">Address: {siteConfig.address || 'Abeokuta, Ogun State'}</p>
          <div className="mt-6">
            <div className="w-full h-48 bg-slate-100 rounded flex items-center justify-center">Map placeholder</div>
          </div>
        </div>
        <div>
          <form className="grid gap-3">
            <label className="sr-only">Name</label>
            <input placeholder="Your name" className="border rounded px-3 py-2" />
            <label className="sr-only">Email</label>
            <input placeholder="Your email" className="border rounded px-3 py-2" />
            <label className="sr-only">Message</label>
            <textarea placeholder="Message" className="border rounded px-3 py-2 h-28" />
            <div className="flex gap-3">
              <button type="button" className="bg-[var(--color-secondary)] text-white px-4 py-2 rounded">Send</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
