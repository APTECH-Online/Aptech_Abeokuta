// Structured curriculum data for the Advanced Diploma in Software Engineering
// (ADSE) page. Transcribed from the official APTECH curriculum material
// supplied for reference — content only, no source imagery is used.

export type AdseModule = { name: string; outcome: string }

export type AdseTermBlock = {
  id: string
  label: string
  hours?: string
  eProject?: string
  exitProfile?: string
  modules: AdseModule[]
}

export type AdseTrackSummary = { id: string; label: string; note: string }

// Year 1 — shared foundation terms every ADSE student completes.
export const adseCoreTerms: AdseTermBlock[] = [
  {
    id: 'term-1',
    label: 'Term 1',
    hours: '166 Hours',
    eProject: 'Website Development',
    modules: [
      {
        name: 'Programming Principles and Techniques',
        outcome: 'Solve programming problems using flowcharts and pseudocode.'
      },
      {
        name: 'Object-Oriented Programming Concepts',
        outcome: 'Develop object-oriented programming skills using OOP principles and concepts.'
      },
      {
        name: 'Logic Building and Elementary Programming',
        outcome: 'Use programming constructs to write programs in C.'
      },
      {
        name: 'Data Management with SQL Server',
        outcome: 'Normalise raw data into well-organised database tables in SQL Server and perform advanced database operations.'
      },
      {
        name: 'Building Modern Websites',
        outcome: 'Use HTML5, CSS3 and JavaScript to implement websites.'
      },
      {
        name: 'React',
        outcome: 'Design and develop responsive websites using React.'
      },
      {
        name: 'UI/UX for Responsive Design',
        outcome: 'Learn the basic principles of effective web UI/UX design.'
      }
    ]
  },
  {
    id: 'term-2',
    label: 'Term 2',
    hours: '148 Hours',
    eProject: 'Java Application Development',
    modules: [
      {
        name: 'Markup Language and JSON',
        outcome: 'Use XML and JSON to store and exchange data.'
      },
      {
        name: 'Fundamentals of Linux Operating System',
        outcome: 'Use the various commands, shell scripts and tools of Linux OS.'
      },
      {
        name: 'Fundamentals of IoT',
        outcome: 'Understand the "what, why and how" of the Internet of Things.'
      },
      {
        name: 'Java Programming I',
        outcome: 'Develop object-oriented applications using Java.'
      },
      {
        name: 'Java Programming II',
        outcome: 'Use advanced language features and application programming interfaces (APIs) of Java.'
      },
      {
        name: 'Programming in C#',
        outcome: 'Develop basic and advanced object-oriented applications using C#.'
      }
    ]
  }
]

// Year 2, Term 3 — splits into a Java or .NET application-development track.
export const adseTerm3Detailed: AdseTermBlock = {
  id: 'term-3a',
  label: 'Term 3a — Java',
  hours: '130 Hours',
  eProject: 'Cross-Platform App Development',
  modules: [
    {
      name: 'Web Component Development',
      outcome: 'Build web applications suited to any Java EE application server using JSP and Servlet technologies.'
    },
    {
      name: 'Integrating App with Spring Framework',
      outcome: 'Develop powerful web applications with the Spring Framework.'
    },
    {
      name: 'Agile and DevOps',
      outcome: 'Implement software development processes using Agile methodology.'
    },
    {
      name: 'Introduction to Dart Programming',
      outcome: 'Learn to code Flutter apps using the Dart programming language.'
    },
    {
      name: 'Application Development Using Flutter and Dart',
      outcome: 'Use the Flutter framework and Dart programming language to develop cross-platform mobile apps.'
    }
  ]
}

export const adseTerm3bDetailed: AdseTermBlock = {
  id: 'term-3b',
  label: 'Term 3b — .NET',
  hours: '122 Hours',
  eProject: 'Cross-Platform App Development',
  modules: [
    {
      name: 'Developing ASP.NET Core Web Applications',
      outcome: 'Develop web applications implementing server-side programming using ASP.NET Core.'
    },
    {
      name: 'Application Development Using Flutter and Dart',
      outcome: 'Use the Flutter framework and Dart programming language to develop cross-platform mobile apps.'
    },
    {
      name: 'Introduction to Dart Programming',
      outcome: 'Learn to code Flutter apps using the Dart programming language.'
    },
    {
      name: 'Agile and DevOps',
      outcome: 'Implement software development processes using Agile methodology.'
    }
  ]
}

// Year 2, Term 4 — seven specialisation pathways. Detailed module content was
// supplied for the Data Science, AI & ML and IoT tracks; the remaining four
// are named specialisations from the official programme map.
export const adseTerm4Specialised: AdseTermBlock[] = [
  {
    id: 'term-4e',
    label: 'Term 4e — Data Science',
    hours: '286 Hours',
    eProject: 'Big Data',
    exitProfile: 'Data Analytics Professional',
    modules: [
      {
        name: 'Programming with Python',
        outcome: 'Understand the syntax and logic of Python programming and learn how Python is used for data analysis and other applications.'
      },
      {
        name: 'Large Data Management with MongoDB',
        outcome: 'Learn MongoDB concepts, features, architecture and data model, and how to install, configure and monitor open-source databases.'
      },
      {
        name: 'Emerging Job Areas — SMAC',
        outcome: 'Learn the basics of social media, mobile technology, analytics and cloud computing along with an understanding of their interconnectivity.'
      },
      {
        name: 'R Programming',
        outcome: 'Master data exploration, data visualisation, predictive analytics and descriptive analytics techniques with the R language.'
      },
      {
        name: 'Foundation of Big Data Systems',
        outcome: 'Learn how components of the Hadoop ecosystem — Hadoop, Yarn, MapReduce, HDFS, Pig, Impala, HBase, Flume and Apache Spark — fit into the big-data processing lifecycle.'
      },
      {
        name: 'Processing Big Data (Hadoop MapReduce, Hive, Pig Latin)',
        outcome: 'Learn to work with adaptable, versatile frameworks based on the Apache Hadoop ecosystem.'
      },
      {
        name: 'Visual Analytics with Tableau',
        outcome: 'Learn how to build visualisations, organise data and design dashboards using Tableau Desktop.'
      },
      {
        name: 'Web and Social Media Analytics (Google Analytics and SAS)',
        outcome: 'Understand the major aspects of the Google Ads network across search, display, mobile and video, and master SAS techniques to access and manage data, create data structures, generate reports and handle errors.'
      }
    ]
  },
  {
    id: 'term-4f',
    label: 'Term 4f — Artificial Intelligence & Machine Learning',
    hours: '282 Hours',
    exitProfile: 'Machine Learning Engineer',
    modules: [
      {
        name: 'Programming with Python',
        outcome: 'Understand the syntax and logic of Python programming and learn how Python is used for data analysis and other applications.'
      },
      {
        name: 'Large Data Management with MongoDB',
        outcome: 'Learn MongoDB concepts, features, architecture and data model, and how to install, configure and monitor open-source databases.'
      },
      {
        name: 'Emerging Job Areas — SMAC',
        outcome: 'Learn the basics of social media, mobile technology, analytics and cloud computing along with an understanding of their interconnectivity.'
      },
      {
        name: 'R Programming',
        outcome: 'Master data exploration, data visualisation, predictive analytics and descriptive analytics techniques with the R language.'
      },
      {
        name: 'AI Primer (ML, DL, Neural Networks)',
        outcome: 'Understand AI concepts and workflows, machine learning and deep learning, and performance metrics.'
      },
      {
        name: 'Natural Language Processing Toolkit',
        outcome: 'Learn essential concepts of Python programming and gain deeper knowledge in data analytics, machine learning, data visualisation, web scraping and natural language processing.'
      },
      {
        name: 'Machine Learning',
        outcome: 'Master machine learning concepts and techniques, including supervised and unsupervised learning, mathematical and heuristic aspects, and hands-on modelling to develop algorithms.'
      },
      {
        name: 'Deep Learning and Machine Learning APIs',
        outcome: 'Master deep learning concepts and the TensorFlow open-source framework, implement deep learning algorithms and build artificial neural networks.'
      }
    ]
  },
  {
    id: 'term-4g',
    label: 'Term 4g — Internet of Things (IoT)',
    hours: '182 Hours',
    eProject: 'IoT',
    exitProfile: 'IoT Developer',
    modules: [
      {
        name: 'Programming with Python',
        outcome: 'Understand the syntax and logic of Python programming and learn how Python is used for data analysis and other applications.'
      },
      {
        name: 'Large Data Management with MongoDB',
        outcome: 'Learn MongoDB concepts, features, architecture and data model, and how to install, configure and monitor open-source databases.'
      },
      {
        name: 'Emerging Job Areas — SMAC',
        outcome: 'Learn the basics of social media, mobile technology, analytics and cloud computing along with an understanding of their interconnectivity.'
      },
      {
        name: 'IoT Hardware',
        outcome: 'Work with IoT hardware, sensors and systems.'
      },
      {
        name: 'IoT Networking',
        outcome: 'Implement networking in IoT applications.'
      },
      {
        name: 'Programming the IoT with Python',
        outcome: 'Build rich IoT applications using IoT technologies, systems and the Python programming language.'
      }
    ]
  }
]

// The remaining four Term 4 pathways named on the official programme map —
// detailed module content was not included in the supplied material.
export const adseTerm4Named: AdseTrackSummary[] = [
  { id: 'term-4a', label: 'Term 4a — OST & Java', note: 'Operating Systems & Technology specialisation paired with Java.' },
  { id: 'term-4b', label: 'Term 4b — OST & .NET', note: 'Operating Systems & Technology specialisation paired with .NET.' },
  { id: 'term-4c', label: 'Term 4c — OST & Oracle', note: 'Operating Systems & Technology specialisation paired with Oracle.' },
  { id: 'term-4d', label: 'Term 4d — OST & Networking', note: 'Operating Systems & Technology specialisation paired with networking.' }
]

export const industryStats = {
  global: {
    title: 'Global industry scenario',
    points: [
      'IT employment is projected to grow by 62 million jobs by 2023.',
      'The IT professional services market is projected to be worth US$1.07 trillion by 2025.',
      'Global IT spending was forecast to reach US$4.3 trillion by 2023.'
    ],
    source: 'Research and Markets; Worldwide Technology Employment Impact Guide, IDC; grandviewresearch.com'
  },
  africa: {
    title: 'Africa industry scenario',
    points: [
      'Africa is one of the fastest-emerging tech landscapes in the digital-transformation era.',
      'The region has roughly 200 African innovation hubs, 3,500 new tech-related ventures and US$1 billion in venture capital flowing to a pan-African movement of start-up entrepreneurs.',
      "Africa's eCommerce market revenue is projected to grow at 13.27% annually (2021–2025), reaching a market volume of US$40,758 million by 2025.",
      'Africa has the fastest-growing rate of mobile penetration, with unique mobile subscribers projected to reach 634 million by 2025.'
    ],
    source: 'Statista; MarketFinder'
  }
}

export const trendingJobRoles = {
  title: 'Trending job roles worldwide',
  roles: [
    'Enterprise Application Developer',
    'Cloud Computing Manager',
    'Data Analyst',
    'Data Scientist',
    'AI Specialist',
    'IT Professional',
    'Business Systems Analyst',
    'Internet of Things Specialist',
    'Information Systems Manager'
  ],
  source: 'getsmarter.com; World Economic Forum, "Jobs of Tomorrow"'
}
