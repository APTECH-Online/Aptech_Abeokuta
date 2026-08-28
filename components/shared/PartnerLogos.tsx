import Image from 'next/image'

const logos = [
  { name: 'Ofqual', src: '/images/partners/ofqual.png', width: 130, height: 56 },
  { name: 'University of Central Lancashire (UCLan)', src: '/images/partners/uclan.png', width: 130, height: 56 },
  { name: 'NCC Education', src: '/images/partners/ncc-education.png', width: 130, height: 56 },
  { name: 'Middlesex University', src: '/images/partners/middlesex.png', width: 130, height: 56 }
]

export default function PartnerLogos() {
  return (
    <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 items-center">
      {logos.map((logo) => (
        <div
          key={logo.name}
          className="card flex items-center justify-center p-5 h-24"
          title={logo.name}
        >
          <Image
            src={logo.src}
            alt={`${logo.name} logo`}
            width={logo.width}
            height={logo.height}
            className="max-h-12 w-auto object-contain"
          />
        </div>
      ))}
    </div>
  )
}
