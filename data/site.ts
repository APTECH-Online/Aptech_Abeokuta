// Central site configuration.

export const siteConfig = {
  name: 'APTECH Abeokuta',
  shortName: 'APTECH',
  tagline: 'Career-focused technology education in Abeokuta',
  description:
    'Advanced software engineering, Smart Pro, and networking education delivered through APTECH Abeokuta.',

  // Contact
  phone: '+234 (0) 803 415 2557',
  whatsapp: '+234 (0) 803 415 2557',
  email: 'aptech.abeokuta@gmail.com',
  address: '#22 Quarry Road, Old Savannah Bank Building, Panseke, Ibara, Abeokuta',
  hours: [
    { day: 'Monday – Friday', time: '9:00 AM – 5:00 PM' },
    { day: 'Saturday', time: '10:00 AM – 2:00 PM' },
    { day: 'Sunday', time: 'Closed' }
  ],

  social: {
    facebook: '[PLACEHOLDER]',
    instagram: '[PLACEHOLDER]',
    linkedin: '[PLACEHOLDER]',
    x: '[PLACEHOLDER]'
  }
}

export const primaryNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Courses', href: '/courses' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Contact', href: '/contact' }
]

export const footerNav = {
  explore: [
    { label: 'Home', href: '/' },
    { label: 'About APTECH', href: '/about' },
    { label: 'Course catalogue', href: '/courses' },
    { label: 'Admissions', href: '/admissions' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Testimonials', href: '/testimonials' }
  ],
  support: [
    { label: 'Contact us', href: '/contact' },
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Terms & conditions', href: '/terms' }
  ]
}

// Qualitative reasons only — no unverified figures.
export const whyChoose = [
  {
    id: 'practical',
    title: 'Hands-on, project-based training',
    body: 'Coursework is built around applied projects and labs that mirror real workplace tasks, not just theory.'
  },
  {
    id: 'curriculum',
    title: 'Industry-aligned curriculum',
    body: 'Programs are structured around the tools and workflows employers currently look for in entry-level tech hires.'
  },
  {
    id: 'instructors',
    title: 'Experienced instructors',
    body: 'Learn from instructors with practical industry backgrounds who can mentor as well as teach.'
  },
  {
    id: 'pathway',
    title: 'Clear learning pathway',
    body: 'Every track moves from fundamentals to applied practice, so you always know what comes next.'
  },
  {
    id: 'support',
    title: 'Career-focused guidance',
    body: 'Structured support to help students prepare for interviews and move into roles after training.'
  },
  {
    id: 'community',
    title: 'A local campus, a global network',
    body: 'Train in Abeokuta as part of the wider APTECH computer education network.'
  }
]

export const admissionsSteps = [
  {
    step: 1,
    title: 'Choose your programme',
    body: 'Browse the course catalogue and pick the track that matches your goals and schedule.'
  },
  {
    step: 2,
    title: 'Submit an application',
    body: 'Complete the enquiry form with your details and preferred programme. Our team will reach out to confirm next steps.'
  },
  {
    step: 3,
    title: 'Attend an orientation',
    body: 'New students are guided through the campus, learning tools, and cohort schedule before classes begin.'
  },
  {
    step: 4,
    title: 'Start learning',
    body: 'Begin coursework with your cohort and instructor, with ongoing support throughout the programme.'
  }
]

export const admissionsRequirements = [
  'A valid form of identification',
  'Academic documents, where applicable to the chosen programme',
  'A completed application/enquiry form',
  'Payment details for registration, confirmed with the admissions office'
]

export const faqs = [
  {
    id: 'faq-1',
    question: 'Do I need prior IT experience to enrol?',
    answer:
      'Entry requirements vary by programme. The course catalogue lists the recommended level for each programme, and admissions can confirm the current requirements for your chosen track.'
  },
  {
    id: 'faq-2',
    question: 'How are classes delivered?',
    answer:
      'Classes combine instructor-led teaching with hands-on lab time. Exact schedule and delivery format for a given cohort are confirmed by the admissions office.'
  },
  {
    id: 'faq-3',
    question: 'What happens after I apply?',
    answer:
      'The admissions team reviews your application and contacts you to confirm your programme, intake, and any outstanding requirements.'
  },
  {
    id: 'faq-4',
    question: 'Are there flexible payment options?',
    answer:
      'Fee structures and payment plans are confirmed directly with the admissions office, since they can vary by programme.'
  },
  {
    id: 'faq-5',
    question: 'Will I receive a certificate?',
    answer:
      'Students who complete a programme\'s requirements receive a certificate of completion. Ask the admissions office for details specific to your track.'
  }
]
