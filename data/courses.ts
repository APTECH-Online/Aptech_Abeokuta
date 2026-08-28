export type Course = {
  slug: string
  title: string
  category: 'Advanced Diploma' | 'Smart Pro' | 'Aptech Certified Network Specialist' | 'Short Term Courses'
  duration: string
  level: string
  mode: string
  summary: string
  description: string
  highlights: string[]
  tools: string[]
  outcomes: string[]
  coverImage?: string
}

export const categories = [
  'Advanced Diploma',
  'Smart Pro',
  'Aptech Certified Network Specialist',
  'Short Term Courses'
] as const

export const courses: Course[] = [
  {
    slug: 'advanced-diploma-software-engineering',
    title: 'Advanced Diploma in Software Engineering',
    category: 'Advanced Diploma',
    duration: '2 years',
    level: 'Professional / Advanced',
    mode: 'Structured, instructor-led programme',
    summary: 'A two-year, four-term software engineering pathway covering programming, databases, web and mobile development, Java and .NET application development, and a choice of Data Science, AI & ML, IoT or platform-specialisation tracks.',
    description:
      'The Advanced Diploma in Software Engineering (ADSE) is a two-year programme built across four terms. Year 1 (Term 1 and Term 2) lays a shared foundation in programming, web development, databases, Linux and Java/C#. Year 2 opens into specialisation: Term 3 offers a Java or .NET application-development track, and Term 4 branches into seven pathways — four platform specialisations (OST paired with Java, .NET, Oracle or Networking) and three fully detailed tracks in Data Science, Artificial Intelligence & Machine Learning, and the Internet of Things — each ending in an industry-aligned exit profile.',
    highlights: [
      'Programming principles, logic building and object-oriented programming in C',
      'Modern web development with HTML5, CSS3, JavaScript and React',
      'Database design and management with SQL Server',
      'Java and C# application development, from core language to advanced APIs',
      'Linux fundamentals and IoT foundations',
      'Java EE web components, the Spring Framework, Agile/DevOps and cross-platform mobile apps with Flutter & Dart',
      'A specialised Term 4 pathway in Data Science, AI & Machine Learning, IoT, or an OST platform track (Java, .NET, Oracle or Networking)',
      'Term-end eProjects and a job-role-aligned exit profile'
    ],
    tools: [
      'C', 'Java', 'C#', 'Python', 'R', 'SQL Server', 'HTML5/CSS3/JavaScript', 'React',
      'Linux', 'Spring Framework', 'Flutter & Dart', 'MongoDB', 'Hadoop & Spark',
      'Tableau', 'TensorFlow', 'IoT Hardware & Networking'
    ],
    outcomes: [
      'Build a strong, progressive foundation in software engineering, from programming logic to full-stack development',
      'Develop Java and .NET applications, including web components, APIs and database-backed systems',
      'Build cross-platform mobile apps with Flutter & Dart, applying Agile/DevOps practice',
      'Specialise in Data Science, AI & Machine Learning, IoT, or a platform track in Java, .NET, Oracle or Networking',
      'Graduate with an industry-aligned exit profile such as Data Analytics Professional, Machine Learning Engineer or IoT Developer'
    ]
  },
  {
    slug: 'smart-pro',
    title: 'Smart Pro',
    category: 'Smart Pro',
    duration: 'Foundation (146 hrs) + a 200-hour specialisation',
    level: 'Professional',
    mode: 'Structured, instructor-led programme',
    summary: 'Aptech Certified Nxt Generation Professional (ACNPRO): a shared foundation in Excel, Python, R and large data management, branching into Data Science, AI & Machine Learning, or Software Testing — each ending in a Professional Diploma.',
    description:
      'Smart Pro — Aptech Certified Nxt Generation Professional (ACNPRO) — starts every learner on a shared 146-hour Foundation covering financial data analysis with MS Excel, Python and R programming, large data management, and emerging job areas (SMAC). From there, learners branch into one of three specialisations: Data Science, Artificial Intelligence & Machine Learning, or Software Testing. Each specialisation adds its own modules and project work on top of the Foundation, culminating in a job-role-aligned Professional Diploma.',
    highlights: [
      'Shared Foundation: financial data analysis with Excel, Python, R programming and large data management',
      'Data Science specialisation: big data systems, Hadoop/Hive/Pig Latin, Tableau, and web & social media analytics',
      'AI & Machine Learning specialisation: AI primer, NLP, machine learning, deep learning and ML APIs',
      'Software Testing specialisation: Java fundamentals, software verification & validation, Agile/DevOps, Selenium and mobile testing',
      'Every specialisation ends in a Professional Diploma with a job-role-aligned exit profile',
      'Real project work: an R project in Foundation, plus a Big Data, ChatBot & Recommendation Engine, or Automation Testing project in the chosen track'
    ],
    tools: [
      'MS Office 2016', 'MS Excel', 'Python', 'R & R Studio', 'MongoDB',
      'Hadoop', 'Spark', 'Hive', 'Pig Latin', 'Tableau', 'Google Analytics', 'SAS Analytics',
      'NetBeans', 'Selenium', 'Robotium', 'SOAP'
    ],
    outcomes: [
      'Build a shared foundation in data analysis, Python and R programming before specialising',
      'Specialise in Data Science, AI & Machine Learning, or Software Testing',
      'Work hands-on with industry tools such as Hadoop, Tableau, TensorFlow-style ML APIs and Selenium',
      'Graduate with a Professional Diploma and a job-role-aligned exit profile such as Data Analyst, Machine Learning Engineer, or Automation Tester'
    ]
  },
  {
    slug: 'aptech-certified-network-specialist',
    title: 'Aptech Certified Network Specialist',
    category: 'Aptech Certified Network Specialist',
    duration: '4 terms · 692 instructional hours',
    level: 'Professional',
    mode: 'Structured, instructor-led programme with theory, lab and self-study hours',
    summary: 'A four-term hardware and networking pathway — from IT hardware fundamentals through networking, Red Hat, Azure administration, enterprise routing and ethical hacking — mapped to industry certifications such as CompTIA A+, Network+, CCNA, CCNP, Azure and CEH.',
    description:
      'The Aptech Certified Network Specialist (ACNS) is a four-term programme delivered through the Aptech Hardware & Networking Academy (product note ACNS-OV-7080). Term 1 builds IT hardware and networking fundamentals aligned to CompTIA A+ and Network+. Term 2 covers modern desktop management, Red Hat system administration, and Cisco networking and cybersecurity operations (CCNA, CyberOps Associate). Term 3 is a dedicated Microsoft Azure administration track (AZ-900, AZ-104, AZ-800, AZ-801). Term 4 moves into enterprise routing and switching and ethical hacking (CCNP Enterprise, CEH v11). Each term pairs theory and lab hours with self-study and ends in a job-role-aligned exit profile.',
    highlights: [
      'Term 1 — IT hardware, troubleshooting and networking fundamentals (CompTIA A+, Network+); exit profile: IT Technician',
      'Term 2 — Modern desktop management, Red Hat system administration, Cisco networking & cybersecurity operations (CCNA, CyberOps Associate); exit profile: Network Administrator',
      'Term 3 — Microsoft Azure administration and architecture (AZ-900, AZ-104, AZ-800, AZ-801); exit profile: Windows Azure Administrator',
      'Term 4 — Enterprise routing & switching and ethical hacking (CCNP Enterprise, CEH v11); exit profile: Network Engineer / Ethical Hacker',
      'Every term blends theory, hands-on lab work and self-study, ending in an eProject or project',
      'Curriculum mapped directly to vendor certification exams throughout'
    ],
    tools: [
      'Windows OS', 'Windows 11', 'RHEL 8.2', 'Network Tools', 'Cloud Tools',
      'Graphical Network Simulator-3 (GNS3)', 'Microsoft Windows Azure', 'Ethical Hacking Tools'
    ],
    outcomes: [
      'Build a strong hardware, OS and networking foundation aligned to CompTIA A+ and Network+',
      'Administer modern desktops, Red Hat Linux systems and Cisco-based networks',
      'Deploy, manage and secure Microsoft Azure environments',
      'Implement enterprise routing, switching and network security, and perform ethical hacking',
      'Graduate ready for exam-mapped certifications including CompTIA A+/Network+, RHCSA, CCNA, CyberOps Associate, Azure AZ-900/AZ-104/AZ-800/AZ-801, CCNP Enterprise and CEH v11'
    ]
  },
  {
    slug: 'ms-office-2019-office-automation',
    title: 'MS Office 2019 Office Automation',
    category: 'Short Term Courses',
    duration: '1 Month',
    level: 'Beginner',
    mode: 'Short-term, instructor-led course',
    summary: 'Hands-on training in Word, Excel, PowerPoint and Outlook for everyday office productivity and document automation.',
    description:
      'MS Office 2019 Office Automation is a one-month short course covering the core Microsoft Office applications — Word, Excel, PowerPoint and Outlook. Learners build practical document formatting, spreadsheet, presentation and email-management skills suited to everyday office and administrative work.',
    highlights: [
      'Document creation and formatting in Word',
      'Spreadsheets, formulas and basic charts in Excel',
      'Building presentations in PowerPoint',
      'Email and calendar management in Outlook'
    ],
    tools: ['MS Word 2019', 'MS Excel 2019', 'MS PowerPoint 2019', 'MS Outlook 2019'],
    outcomes: [
      'Create and format professional documents, spreadsheets and presentations',
      'Apply basic automation features to speed up routine office tasks',
      'Manage email and schedules confidently using Outlook'
    ]
  },
  {
    slug: 'responsive-web-development',
    title: 'Responsive Web Development',
    category: 'Short Term Courses',
    duration: '4 Months',
    level: 'Beginner to Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A four-month course covering HTML5, CSS3 and JavaScript to design and build responsive, mobile-friendly websites.',
    description:
      'Responsive Web Development is a four-month short course that takes learners from HTML5 and CSS3 fundamentals through to JavaScript and responsive design techniques, so they can build websites that work well across desktop, tablet and mobile screens.',
    highlights: [
      'HTML5 structure and semantic markup',
      'CSS3 styling, layout and responsive design techniques',
      'JavaScript fundamentals for interactivity',
      'Building and deploying a responsive website project'
    ],
    tools: ['HTML5', 'CSS3', 'JavaScript'],
    outcomes: [
      'Build responsive, mobile-friendly websites from scratch',
      'Apply modern layout techniques across screen sizes',
      'Add interactivity to web pages using JavaScript'
    ]
  },
  {
    slug: 'advanced-excel-2019',
    title: 'Advanced Excel 2019',
    category: 'Short Term Courses',
    duration: '1 Month',
    level: 'Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A one-month course covering advanced formulas, functions, PivotTables and data analysis tools in Excel 2019.',
    description:
      'Advanced Excel 2019 builds on basic spreadsheet skills to cover advanced formulas and functions, data analysis, PivotTables and charting — practical skills for reporting, budgeting and data-driven office roles.',
    highlights: [
      'Advanced formulas and functions (lookup, logical, statistical)',
      'PivotTables and PivotCharts for data summarisation',
      'Data validation, conditional formatting and analysis tools',
      'Dashboard and report building in Excel'
    ],
    tools: ['MS Excel 2019'],
    outcomes: [
      'Use advanced formulas and functions to solve real data problems',
      'Summarise and analyse data using PivotTables',
      'Build simple dashboards and reports in Excel'
    ]
  },
  {
    slug: 'graphics-design',
    title: 'Graphics Design',
    category: 'Short Term Courses',
    duration: '2 Months',
    level: 'Beginner to Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A two-month course covering design principles and industry-standard graphics tools for print and digital media.',
    description:
      'The Graphics Design short course introduces design fundamentals — colour, typography and layout — alongside hands-on practice with industry-standard graphics software, preparing learners to design for print and digital media.',
    highlights: [
      'Design principles: colour, typography and layout',
      'Image editing and manipulation',
      'Vector and logo design',
      'Designing for print and digital/social media'
    ],
    tools: ['Adobe Photoshop', 'Adobe Illustrator', 'CorelDRAW'],
    outcomes: [
      'Apply core design principles to real projects',
      'Design logos, flyers and social media graphics',
      'Prepare artwork for both print and digital use'
    ]
  },
  {
    slug: 'linux',
    title: 'Linux',
    category: 'Short Term Courses',
    duration: '1 Month',
    level: 'Beginner to Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A one-month course covering Linux fundamentals, the command line, file systems and basic system administration.',
    description:
      'This short course covers Linux fundamentals — installation, the command line, file systems, permissions and basic system administration — building a foundation for further work in servers, networking and DevOps.',
    highlights: [
      'Linux installation and the command-line interface',
      'File systems, permissions and user management',
      'Package management and basic shell scripting',
      'Fundamentals of Linux system administration'
    ],
    tools: ['Linux'],
    outcomes: [
      'Navigate and operate a Linux system confidently from the command line',
      'Manage files, users and permissions on Linux',
      'Build a foundation for further server and networking study'
    ]
  },
  {
    slug: 'python-django',
    title: 'Python (Django)',
    category: 'Short Term Courses',
    duration: '3 Months',
    level: 'Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A three-month course covering Python programming and the Django framework for building web applications.',
    description:
      'This short course covers core Python programming before moving into the Django framework, so learners can build database-backed web applications with Python — from models and views to templates and deployment basics.',
    highlights: [
      'Python programming fundamentals and data structures',
      'Working with the Django framework: models, views and templates',
      'Database-backed web application development',
      'Building and testing a Django project'
    ],
    tools: ['Python', 'Django', 'SQL'],
    outcomes: [
      'Write Python programs using core language features',
      'Build database-backed web applications with Django',
      'Understand the request/response cycle of a Django app'
    ]
  },
  {
    slug: 'java-i-ii',
    title: 'Java I & II',
    category: 'Short Term Courses',
    duration: '2 Months',
    level: 'Beginner to Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A two-month course covering core Java programming, from fundamentals through object-oriented programming.',
    description:
      'Java I & II is a two-month short course covering core Java programming — syntax, control structures and object-oriented programming — building the foundation needed for further application development.',
    highlights: [
      'Java syntax, data types and control structures',
      'Object-oriented programming: classes, objects and inheritance',
      'Exception handling and collections',
      'Building simple Java applications'
    ],
    tools: ['Java'],
    outcomes: [
      'Write Java programs using core language features',
      'Apply object-oriented programming principles in Java',
      'Build a foundation for further Java application development'
    ]
  },
  {
    slug: 'windows-server-admin',
    title: 'Windows Server Admin',
    category: 'Short Term Courses',
    duration: '1 Month',
    level: 'Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A one-month course covering Windows Server installation, Active Directory and core system administration tasks.',
    description:
      'This short course covers the essentials of Windows Server administration — installation and configuration, Active Directory, user and group management, and core networking services — for learners moving into IT support and infrastructure roles.',
    highlights: [
      'Windows Server installation and configuration',
      'Active Directory and user/group management',
      'File sharing, permissions and basic networking services',
      'Routine server administration and maintenance tasks'
    ],
    tools: ['Windows Server', 'Active Directory'],
    outcomes: [
      'Install and configure a Windows Server environment',
      'Manage users, groups and permissions with Active Directory',
      'Perform routine Windows Server administration tasks'
    ]
  },
  {
    slug: 'data-mgt-sql-server-2016',
    title: 'Data Management — SQL Server 2016',
    category: 'Short Term Courses',
    duration: '4 Months',
    level: 'Intermediate',
    mode: 'Short-term, instructor-led course',
    summary: 'A four-month course covering database design, SQL querying and data management using SQL Server 2016.',
    description:
      'This short course covers relational database design and management using SQL Server 2016 — from tables and relationships to writing SQL queries, stored procedures and basic database administration.',
    highlights: [
      'Relational database design and normalisation',
      'Writing SQL queries: SELECT, JOIN, and aggregate functions',
      'Stored procedures, views and triggers',
      'Basic SQL Server database administration'
    ],
    tools: ['SQL Server 2016', 'SQL'],
    outcomes: [
      'Design and build relational databases in SQL Server',
      'Write SQL queries to retrieve and manipulate data',
      'Perform basic database administration tasks'
    ]
  }
]

export function getCourseBySlug(slug: string) {
  return courses.find((c) => c.slug === slug)
}

export function getRelatedCourses(course: Course, limit = 3) {
  return courses.filter((c) => c.slug !== course.slug).slice(0, limit)
}
