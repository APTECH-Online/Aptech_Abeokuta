import Link from 'next/link'
import { siteConfig } from '../../data/site'

export default function Footer(){
  return (
    <footer className="bg-white border-t mt-10">
      <div className="container py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-bold">APTECH Abeokuta</h3>
          <p className="mt-2 text-slate-600 max-w-sm">{siteConfig.description}</p>
        </div>
        <div>
          <h4 className="font-semibold">Quick Links</h4>
          <ul className="mt-2 space-y-2">
            <li><Link href="/courses" className="hover:underline">Courses</Link></li>
            <li><Link href="/admissions" className="hover:underline">Admissions</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Contact</h4>
          <p className="mt-2 text-slate-600">Email: {siteConfig.email || 'info@example.com'}</p>
          <p className="mt-1 text-slate-600">Phone: {siteConfig.phone || 'Placeholder'}</p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-sm">© 2026 APTECH Abeokuta. All rights reserved.</div>
    </footer>
  )
}
