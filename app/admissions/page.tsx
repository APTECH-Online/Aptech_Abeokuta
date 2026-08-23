export const metadata = {
  title: 'Admissions — APTECH Abeokuta',
  description: 'Admissions information and how to apply.'
}

export default function Admissions() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">Admissions</h1>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold">How to Apply</h3>
          <ol className="list-decimal ml-6 mt-3 text-muted">
            <li>Select a course</li>
            <li>Complete the application form</li>
            <li>Submit required documents</li>
          </ol>
        </div>
        <div>
          <h3 className="font-semibold">Requirements</h3>
          <p className="mt-2 text-muted">Basic ID, academic documents (if applicable), and payment details.</p>
        </div>
      </div>
      <div className="mt-8">
        <button className="bg-[var(--color-accent)] text-white px-4 py-2 rounded">Apply Now</button>
      </div>
    </section>
  )
}
