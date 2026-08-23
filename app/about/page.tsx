import Link from 'next/link'

export const metadata = {
  title: 'About — APTECH Abeokuta',
  description: 'About APTECH Abeokuta — mission, vision and values.'
}

export default function About() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">About APTECH Abeokuta</h1>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-lg text-slate-700">APTECH provides career-focused technology education and practical IT training.</p>
          <div className="mt-6">
            <h3 className="font-semibold">Mission</h3>
            <p className="text-slate-600">Deliver industry-relevant training and career pathways.</p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Vision</h3>
            <p className="text-slate-600">Empower students to succeed in the digital economy.</p>
          </div>

          <div className="mt-6">
            <Link href="/admissions" className="inline-block bg-[var(--color-secondary)] text-white px-4 py-2 rounded shadow-sm hover:shadow-md transition">
              Admissions
            </Link>
          </div>
        </div>
        <div>
          <div className="w-full h-56 bg-slate-100 rounded overflow-hidden">
            <img src="/images/about-illustration.svg" alt="About illustration" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Key Statistics</h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/** Use placeholder stats from config */}
          <div className="p-4 bg-white border rounded text-center">
            <div className="text-2xl font-bold">20+</div>
            <div className="text-sm text-slate-600">Years of Technology Training</div>
          </div>
          <div className="p-4 bg-white border rounded text-center">
            <div className="text-2xl font-bold">10+</div>
            <div className="text-sm text-slate-600">Professional Programs</div>
          </div>
          <div className="p-4 bg-white border rounded text-center">
            <div className="text-2xl font-bold">1,000+</div>
            <div className="text-sm text-slate-600">Students Trained</div>
          </div>
          <div className="p-4 bg-white border rounded text-center">
            <div className="text-2xl font-bold">Career-Focused</div>
            <div className="text-sm text-slate-600">Learning</div>
          </div>
        </div>
      </section>
    </section>
  )
}
