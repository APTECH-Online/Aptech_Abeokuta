/**
 * Default (version 1) Privacy Policy and Terms & Conditions.
 *
 * These are the fallback used by /privacy and /terms when no published row
 * exists in `legal_documents`, and the text the CRM seeds as version 1.
 * After that, staff edit and publish new versions from
 * Admin → Settings → Legal & policies.
 *
 * Body format: paragraphs are separated by a blank line; lines starting with
 * "- " are rendered as bullets. {{email}}, {{phone}} and {{address}} are
 * replaced with the live Contact info at render time.
 */
export type LegalSlug = 'privacy' | 'terms'
export type LegalSection = { heading: string; body: string }
export type LegalDoc = {
  slug: LegalSlug
  version: number
  title: string
  summary: string
  effectiveDate: string // YYYY-MM-DD
  sections: LegalSection[]
}

export const LEGAL_SLUGS: LegalSlug[] = ['privacy', 'terms']
export const LEGAL_LABELS: Record<LegalSlug, string> = { privacy: 'Privacy Policy', terms: 'Terms & Conditions' }
export const LEGAL_PATHS: Record<LegalSlug, string> = { privacy: '/privacy', terms: '/terms' }

export const DEFAULT_LEGAL: Record<LegalSlug, LegalDoc> = {
  privacy: {
    slug: 'privacy',
    version: 1,
    title: 'Privacy policy',
    effectiveDate: '2026-10-08',
    summary:
      'This policy explains what personal information APTECH Abeokuta collects through this website, why we collect it, who sees it, how long we keep it, and the choices you have. It is written to follow the Nigeria Data Protection Act 2023.',
    sections: [
      {
        heading: 'Who we are',
        body:
          'APTECH Abeokuta is a computer and IT training centre at {{address}}. We decide how and why the personal information described in this policy is used, which makes us the data controller for it.\n\nQuestions about this policy or your information can be sent to {{email}} or {{phone}}.'
      },
      {
        heading: 'Information we collect',
        body:
          'We only collect what you choose to submit, plus limited technical information described below.\n\n- Admissions enquiry form: name, email, phone and WhatsApp number, gender, date of birth, address, city, state and country, highest qualification, institution, graduation year, previous IT experience, programme of interest, preferred study mode and intake, and how you heard about us.\n- Contact form: name, email, phone number, subject and your message.\n- Career discovery quiz: your quiz answers and recommendation, and the name, phone and email you choose to leave so an advisor can follow up.\n- Tech Zone challenges: your name, email and/or phone number, challenge answers and score, and your preferred way to be contacted.\n- Conversations with our team by phone, WhatsApp, email or in person, which our staff may record as notes against your enquiry.\n\nWe do not collect payment card details through this website. Please do not send card numbers or passwords in any form or message.'
      },
      {
        heading: 'Information collected automatically',
        body:
          'To understand which campaigns and pages bring people to us, and to improve the website, we record:\n\n- Marketing attribution: the page you landed on, the website that referred you, and campaign tags in the link (UTM tags). This is kept in your browser and attached to your enquiry if you submit one.\n- Interaction events: actions such as starting the quiz, comparing programmes or clicking an enquiry button, linked to a random session identifier (not your name). If you later submit a form, these events can be linked to your enquiry.\n- Your IP address is used briefly to limit repeated form submissions and block abuse. We do not store it in our admissions system.\n\nAt the time of writing this website does not use third-party advertising trackers or third-party analytics scripts.'
      },
      {
        heading: 'Why we use your information',
        body:
          'We use your information to:\n\n- reply to your enquiry or message and guide you to a suitable programme;\n- process your application, enrolment and academic records;\n- follow up with you about admissions, using the contact method you gave us;\n- send programme news, events and updates, only if you have opted in to receive them;\n- understand how the website and our campaigns perform, and keep the website secure; and\n- meet our legal and regulatory obligations.\n\nOur lawful bases are your consent (for example when you tick the consent box on a form), steps taken at your request before enrolling you, our legitimate interest in running and securing the website and improving our programmes, and legal obligations. You can withdraw consent at any time.'
      },
      {
        heading: 'Marketing and communications',
        body:
          'Replying to your enquiry is not marketing. We only send promotional messages by email, WhatsApp or phone if you opted in on a form, and every promotional message gives you a way to opt out. You can also tell us at any time at {{email}} and we will update your record. Opting out of marketing does not stop messages we need to send about an application you have made.'
      },
      {
        heading: 'Who we share information with',
        body:
          'We do not sell your personal information. Access inside APTECH Abeokuta is limited to staff who need it, based on their role.\n\nWe use trusted service providers who process information on our behalf, including:\n\n- hosting and database providers that store the information you submit;\n- an email delivery service, when email acknowledgements are enabled;\n- Google Maps, which loads on our Contact page and may receive technical information from your browser when it does;\n- WhatsApp (Meta) if you choose to open a WhatsApp chat with us, which is then governed by WhatsApp\'s own terms and privacy notice.\n\nIf you enrol, we may share the details needed to register you for certification or examinations with the relevant awarding or partner organisation. We may also disclose information where the law requires it.'
      },
      {
        heading: 'Transfers outside Nigeria',
        body:
          'Some of our service providers store or process information on servers outside Nigeria. Where that happens we take reasonable steps to make sure your information is protected to a standard comparable to Nigerian data protection law.'
      },
      {
        heading: 'Security and how long we keep information',
        body:
          'Information you submit is stored in our admissions system. Staff sign in with individual accounts, access is restricted by role, and important actions are logged.\n\nWe keep information only as long as we need it for the purposes above. Records of people who enrol are kept as academic and administrative records. Enquiries that do not lead to enrolment are reviewed periodically and deleted or anonymised when no longer needed. No online system is completely secure, but we work to protect your information and will act promptly if something goes wrong.'
      },
      {
        heading: 'Applicants under 18',
        body:
          'Our admissions form asks for a date of birth. If you are under 18, please involve a parent or guardian before you submit your details. Where our records show an applicant is under 18, we mark the record and ask for a parent or guardian\'s agreement before enrolment. If a child\'s information was submitted without a parent or guardian\'s knowledge, contact us and we will remove it.'
      },
      {
        heading: 'Your rights',
        body:
          'Under Nigerian data protection law you can ask us to:\n\n- tell you what personal information we hold about you and give you a copy;\n- correct information that is wrong or incomplete;\n- delete your information, where we no longer need it or are not required to keep it;\n- restrict or stop certain uses, including marketing;\n- withdraw consent you have given; and\n- provide your information in a commonly used format where that applies.\n\nEmail {{email}} and we will verify who you are and aim to respond within 30 days. If you are not satisfied with our response you may complain to the Nigeria Data Protection Commission (NDPC).'
      },
      {
        heading: 'Browser storage',
        body:
          'This website stores small items in your browser so features work and so we can measure campaigns. We do not use them for advertising.\n\n- Marketing attribution (local storage): the campaign tags, referrer and landing page described above.\n- Analytics session (session storage): a random identifier that lasts until you close the tab.\n- Programme shortlist (local storage): the programmes you add to compare, so they stay when you move between pages.\n- Tech Zone preferences (local storage): recently seen challenge questions, to avoid repeats.\n\nYou can clear these any time in your browser settings. The website will still work, but your shortlist and recent questions will reset.'
      },
      {
        heading: 'Links to other websites',
        body:
          'Our website links to other sites, including social media pages and WhatsApp. We are not responsible for their content or privacy practices, so please read their policies.'
      },
      {
        heading: 'Changes to this policy',
        body:
          'We may update this policy when our practices or the law change. The effective date and version number at the top show when the current version took effect. When we make an important change we will say so on this page. When you submit a form we record which version of this policy was in force.'
      }
    ]
  },
  terms: {
    slug: 'terms',
    version: 1,
    title: 'Terms & conditions',
    effectiveDate: '2026-10-08',
    summary:
      'These terms apply when you use the APTECH Abeokuta website, send us an enquiry or apply to study with us. They sit alongside our Privacy Policy.',
    sections: [
      {
        heading: 'Using this website',
        body:
          'By using this website or submitting a form on it you agree to these terms. If you do not agree, please do not use the website. You must be at least 18 to submit a form yourself; if you are younger, please ask a parent or guardian to help you.'
      },
      {
        heading: 'Programme information',
        body:
          'We work to keep programme details such as duration, level, content, admission status and intake information accurate. They can change, and they are not a binding offer. Fees, intake dates and availability are confirmed directly by the admissions office. Information about careers and skills is general guidance, not a promise of a job, placement or income.'
      },
      {
        heading: 'Enquiries and applications',
        body:
          'Submitting an enquiry or application form does not guarantee you a place. You agree that the information you give us is accurate and complete, and that we may contact you about it using the details you provide. We may decline or withdraw an offer if information is false or entry requirements are not met.'
      },
      {
        heading: 'Enrolment and admission',
        body:
          'A place on a programme is confirmed once the admissions office has reviewed your application, confirmed you meet the entry requirements for that programme, and received the applicable registration payment.'
      },
      {
        heading: 'Fees and payment',
        body:
          'Programme fees, instalment options and payment deadlines are confirmed directly with the admissions office at the time of enrolment, since they can vary by programme and intake. Refund, deferment and transfer terms, where they apply, are confirmed in writing at enrolment.\n\nOnly pay into accounts and through channels confirmed by the admissions office in writing or in person at {{address}}. If you are unsure whether a payment request is genuine, contact us on {{phone}} before paying.'
      },
      {
        heading: 'Attendance',
        body:
          'Regular attendance is expected for all instructor-led sessions and lab time. Students who expect to miss a session should tell their instructor or the admissions office in advance where possible.'
      },
      {
        heading: 'Student conduct',
        body:
          'Students are expected to treat instructors, staff and fellow students with respect, to follow campus safety rules, and to use equipment, software and facilities responsibly. Misusing equipment, networks or other people\'s data, harassment, cheating and damaging property may lead to suspension or removal from a programme.'
      },
      {
        heading: 'Certification',
        body:
          'Students who complete a programme\'s requirements receive a certificate of completion. Some programmes may also lead to certification from an external awarding or partner body, which has its own rules, assessments and fees. Ask the admissions office for the certification details specific to your track.'
      },
      {
        heading: 'Acceptable use of the website',
        body:
          'You agree not to:\n\n- submit false, misleading or someone else\'s personal information;\n- send spam, malicious code or automated or excessive requests;\n- try to gain unauthorised access to the website, the admissions system or other users\' information; or\n- copy or scrape the website at scale without our written permission.'
      },
      {
        heading: 'Intellectual property',
        body:
          'The website\'s text, graphics, logos, course materials and design belong to APTECH Abeokuta or its licensors, and APTECH and other partner names and logos belong to their respective owners. You may view and share pages for personal, non-commercial use, but you may not reproduce or reuse our content for other purposes without permission.'
      },
      {
        heading: 'Third-party services and links',
        body:
          'The website links to or uses third-party services such as WhatsApp, Google Maps and social media. They are governed by their own terms and we are not responsible for them.'
      },
      {
        heading: 'Limits of our responsibility',
        body:
          'We provide the website "as is" and work to keep it available and accurate, but we cannot promise it will always be uninterrupted or error-free. To the extent the law allows, APTECH Abeokuta is not liable for losses arising from your use of the website or reliance on its general information. Nothing in these terms limits any right you have under Nigerian law that cannot be limited.'
      },
      {
        heading: 'Privacy',
        body:
          'How we handle personal information is explained in our Privacy Policy at /privacy.'
      },
      {
        heading: 'Governing law',
        body:
          'These terms are governed by the laws of the Federal Republic of Nigeria.'
      },
      {
        heading: 'Changes to these terms',
        body:
          'We may update these terms from time to time. The version number and effective date at the top show the current version. When you submit a form we record which version was in force. Continuing to use the website after a change means you accept the updated terms.\n\nQuestions about these terms can be sent to {{email}}.'
      }
    ]
  }
}
