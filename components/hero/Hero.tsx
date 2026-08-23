import Link from 'next/link'
import Image from 'next/image'

export default function Hero(){
  return (
    <section className="bg-white border-b">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">Build Your Future with Technology</h1>
          <p className="mt-4 text-slate-600 max-w-prose">Gain practical IT skills, industry-focused training, and career-ready knowledge at APTECH Abeokuta.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/courses" className="inline-flex items-center bg-[var(--color-secondary)] text-white px-4 py-2 rounded shadow-sm hover:shadow-md transition">Explore Courses</Link>
            <Link href="/contact" className="inline-flex items-center px-4 py-2 border rounded hover:bg-slate-50 transition">Contact Us</Link>
          </div>

          <ul className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
            <li>Industry-focused training</li>
            <li aria-hidden className="opacity-40">•</li>
            <li>Practical learning</li>
            <li aria-hidden className="opacity-40">•</li>
            <li>Career development</li>
          </ul>
        </div>

        <div className="w-full h-64 md:h-72">
          <Image src="/images/hero-tech.svg" alt="Technology classroom illustration" width={640} height={480} className="rounded" priority />
        </div>
      </div>
    </section>
  )
}
