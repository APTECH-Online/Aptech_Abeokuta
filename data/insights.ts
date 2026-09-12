// NOTE: superseded by the Supabase-backed Insights & Events CMS
// (see supabase/migrations/0004_insights.sql and lib/insights-public.ts).
// The public site no longer imports from this file — these six articles
// were migrated into the `insights` table (same slugs, same content) so
// existing URLs keep working. Left in place per the CMS brief's
// "don't delete existing useful content" instruction, and as the
// reference copy the migration's seed data was generated from.
//
// Insights articles. These are general career/technology guidance pieces —
// none of them claim specific Aptech Abeokuta statistics, employment
// outcomes, partnerships or events that aren't already established
// elsewhere in this data layer (see data/courses.ts and data/site.ts for
// what IS verified). Where an article references APTECH Abeokuta directly,
// it only points to real programmes already defined in data/courses.ts.

export type InsightCategory = 'Career Guides' | 'Technology' | 'Student Guides' | 'APTECH Abeokuta'

export type InsightPost = {
  slug: string
  title: string
  category: InsightCategory
  excerpt: string
  body: string[] // paragraphs
}

export const insightCategories: InsightCategory[] = ['Career Guides', 'Technology', 'Student Guides', 'APTECH Abeokuta']

export const insights: InsightPost[] = [
  {
    slug: 'how-to-become-a-software-developer-in-nigeria',
    title: 'How to Become a Software Developer in Nigeria',
    category: 'Career Guides',
    excerpt:
      'A practical, step-by-step look at the skills, learning path and portfolio work that actually matter for landing a software development role in Nigeria today.',
    body: [
      "Software development remains one of the most accessible tech careers to break into without a traditional computer science degree, because employers in Nigeria's fast-growing tech sector generally care more about what you can build than which certificate hangs on your wall.",
      'Start with programming fundamentals — variables, control flow, functions and basic data structures — in one language before spreading yourself across many. Most learners do this with a general-purpose language like Python or Java, or go straight into web fundamentals with HTML, CSS and JavaScript if front-end work appeals to you.',
      'From there, pick a specialisation: front-end (React and modern JavaScript), back-end (a language like Java, C# or Python paired with databases and APIs), or full-stack. Structured programmes such as the Advanced Diploma in Software Engineering are built specifically to take a beginner through this progression in order, rather than leaving you to guess which topic to learn next.',
      "A portfolio matters more than most beginners expect. Two or three well-documented projects — even simple ones — that you can explain in an interview will do more for your job prospects than a long list of tutorials watched. Building real, working software, including the debugging and testing that goes with it, is what separates someone who has 'learned about' programming from someone who can actually do the job.",
      'Finally, treat the learning curve as ongoing. The tools and frameworks used in professional development change every few years; the constant is a solid grasp of fundamentals and the habit of learning independently once you are employed.'
    ]
  },
  {
    slug: 'it-skills-students-should-learn',
    title: 'IT Skills Students Should Learn Before Graduating',
    category: 'Career Guides',
    excerpt:
      'The practical, employer-relevant skills that consistently separate job-ready graduates from those who struggle to find their first tech role.',
    body: [
      "It's tempting to chase whichever technology is trending, but employers consistently value a smaller set of durable skills over flashy ones.",
      'Version control (Git) is non-negotiable — almost every professional software team uses it daily, yet many self-taught learners skip it entirely. Basic command-line comfort, understanding how the operating system you work on actually functions, and being able to read someone else\'s code are similarly underrated but constantly used.',
      'On the data side, even a working knowledge of SQL and how databases are structured will serve you regardless of which specific role you end up in — from software development to data analysis to IT support.',
      'Communication is the most overlooked "technical" skill. Being able to explain a bug, write a clear commit message, or describe a problem to a non-technical colleague is something structured, instructor-led training environments are specifically designed to build through project work and presentations, in a way that solo online learning rarely forces you to practise.'
    ]
  },
  {
    slug: 'what-is-cybersecurity-and-why-it-matters',
    title: "What Is Cybersecurity, and Why Does It Matter Right Now?",
    category: 'Technology',
    excerpt:
      'A plain-language introduction to cybersecurity fundamentals, common career entry points, and why demand for these skills keeps growing.',
    body: [
      'Cybersecurity is the practice of protecting computer systems, networks and data from unauthorised access, damage or theft. As more of daily life, business and government moves online, the attack surface — every place a system could be exploited — keeps expanding, and so does the need for people who understand how to defend it.',
      'Entry points into the field vary. Some start from a networking and systems administration background (understanding how networks are built before learning how to defend them), which is why network-focused certifications like CompTIA Network+ and CCNA are often a practical first step before specialising into security-specific certifications.',
      'Others come from software, learning how vulnerabilities appear in code and how to test for them — the basis of ethical hacking and penetration testing, often validated by certifications such as CEH.',
      'Whichever path you take, the fundamentals are consistent: understand how systems normally work before learning how they can be broken, and build hands-on experience in a lab environment rather than relying on theory alone.'
    ]
  },
  {
    slug: 'data-analytics-vs-data-science',
    title: "Data Analytics vs. Data Science: What's the Difference?",
    category: 'Technology',
    excerpt:
      'Two closely related fields with different day-to-day work, different tools, and different starting points for beginners.',
    body: [
      "The terms get used almost interchangeably, but the actual work differs. Data analytics is primarily about examining existing data to answer specific business questions — using tools like Excel, SQL and visualisation platforms such as Power BI or Tableau to spot patterns and report on what has already happened.",
      'Data science goes further, often building predictive models using statistics, programming (typically Python or R) and machine learning to forecast what is likely to happen next, or to automate a decision that would otherwise require human judgement.',
      "In practice, most people starting out benefit from learning analytics fundamentals first — spreadsheet and SQL fluency, basic statistics, and a visualisation tool — before layering on the programming and machine learning skills that data science requires. Programmes structured around a shared foundation before branching into specialisation, such as Smart Pro's Foundation-then-specialisation model, follow this same logic deliberately."
    ]
  },
  {
    slug: 'study-tips-for-learning-to-code',
    title: 'Study Tips for Learning to Code (That Actually Work)',
    category: 'Student Guides',
    excerpt:
      "Common mistakes new programming students make, and habits that make the learning curve noticeably less painful.",
    body: [
      "The single biggest mistake new coding students make is passively watching or reading instead of typing code themselves. Programming is a skill you build through repetition and mistakes, not one you absorb by observation — type out every example yourself, even ones that look simple.",
      "Expect to be stuck. Getting an error message, not knowing why your code isn't working, and spending twenty minutes on a bug that turns out to be a missing comma is completely normal, not a sign you're bad at this. Learning to read error messages calmly and methodically is itself a skill worth practising.",
      'Build things you actually care about as soon as the fundamentals allow it. A small project of your own choosing will teach you more, and keep you more motivated, than the tenth generic tutorial exercise.',
      "Finally, don't isolate yourself. Studying alongside classmates or in a cohort — asking questions out loud, explaining a concept to someone else, comparing approaches — consistently produces better outcomes than studying entirely alone, which is one of the main practical advantages of structured, instructor-led training over self-study."
    ]
  },
  {
    slug: 'choosing-between-short-course-and-diploma',
    title: 'Short Course or Diploma? How to Choose the Right Programme Length',
    category: 'Student Guides',
    excerpt:
      "A short, focused course and a longer diploma programme solve different problems. Here's how to work out which one fits your situation.",
    body: [
      'A short, focused course — a few weeks on a specific tool or skill like Advanced Excel, a specific programming language, or a particular certification track — makes sense when you already have a general direction and need one concrete, immediately-usable skill added to what you know.',
      'A longer diploma-style programme makes more sense when you are starting from very little existing background and want a structured path that builds fundamentals first, then specialises — the kind of progression the Advanced Diploma in Software Engineering and Aptech Certified Network Specialist programmes are built around.',
      "If you're unsure, our own Program Finder tool on the homepage is a quick way to get a starting recommendation based on your interests and how much time you can commit, and admissions staff can talk through your specific situation in more detail."
    ]
  }
]

export function getInsightBySlug(slug: string) {
  return insights.find((i) => i.slug === slug)
}

export function getRelatedInsights(post: InsightPost, limit = 3) {
  return insights.filter((i) => i.slug !== post.slug && i.category === post.category).slice(0, limit)
}
