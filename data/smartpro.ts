// Structured curriculum data for Smart Pro — Aptech Certified Nxt Generation
// Professional (ACNPRO). Transcribed from the official APTECH programme
// material supplied for reference — content only, no source imagery is used.

export type SmartProModule = { name: string; hours: string }

export type SmartProBlock = {
  id: string
  label: string
  hours: string
  modules: SmartProModule[]
  softwareTraining: string[]
  jobProfiles?: string[]
  diploma?: { name: string; hours: string }
  about?: string[]
}

// Shared foundation every Smart Pro (ACNPRO) learner completes before
// branching into a specialisation.
export const smartProFoundation: SmartProBlock = {
  id: 'foundation',
  label: 'Foundation',
  hours: '146 Hours',
  modules: [
    { name: 'Financial Data Analysis with MS Excel', hours: '16' },
    { name: 'Python Programming', hours: '40' },
    { name: 'Emerging Job Areas — SMAC', hours: '08' },
    { name: 'Large Data Management', hours: '40' },
    { name: 'R Programming', hours: '40' },
    { name: 'Project (R)', hours: '02' }
  ],
  softwareTraining: ['MS Office 2016', 'Python', 'MongoDB', 'R Studio']
}

// The three specialisation tracks branching off the Foundation, each ending
// in a Professional Diploma.
export const smartProTracks: SmartProBlock[] = [
  {
    id: 'data-science',
    label: 'Data Science',
    hours: '200 Hours',
    diploma: { name: 'Professional Diploma in Data Science', hours: '346 Hours' },
    about: [
      'Data science blends data inference, algorithm development and technology to solve analytically complex problems.',
      'It is ultimately about using data in creative ways to generate business value.',
      'A Data Scientist performs exploratory analysis to discover insights hidden in data, primarily to support decisions and predictions.'
    ],
    modules: [
      { name: 'Foundation of Big Data Systems', hours: '44' },
      { name: 'Processing Big Data (Hadoop MapReduce, Hive, Pig Latin)', hours: '36' },
      { name: 'Visual Analytics with Tableau', hours: '40' },
      { name: 'Web and Social Media Analytics (Google Analytics and SAS)', hours: '40' },
      { name: 'Project — Big Data', hours: '40' }
    ],
    softwareTraining: ['Hadoop', 'Spark', 'Hive', 'Pig Latin', 'Tableau', 'Google Analytics Tools', 'SAS Analytics'],
    jobProfiles: ['Data Visualizer', 'Data Analyst']
  },
  {
    id: 'ai-ml',
    label: 'Artificial Intelligence & Machine Learning',
    hours: '200 Hours',
    diploma: { name: 'Professional Diploma in AI and Machine Learning', hours: '346 Hours' },
    about: [
      'AI is an area of computer science that focuses on creating intelligent machines that work and react like humans.',
      'AI-enabled systems are built for tasks such as speech recognition, learning, planning and problem solving.',
      'At its core, AI is the science and engineering of building intelligent systems — especially intelligent computer programs.'
    ],
    modules: [
      { name: 'AI Primer (ML, DL, Neural Networks)', hours: '16' },
      { name: 'Natural Language Processing Toolkit', hours: '44' },
      { name: 'Machine Learning', hours: '40' },
      { name: 'Deep Learning and Machine Learning APIs', hours: '60' },
      { name: 'Project — ChatBot and Recommendation Engine', hours: '40' }
    ],
    softwareTraining: ['Python', 'APIs', 'R Studio'],
    jobProfiles: ['Machine Learning Engineer']
  },
  {
    id: 'software-testing',
    label: 'Software Testing',
    hours: '146 Hours',
    diploma: { name: 'Professional Diploma in Software Testing', hours: '292 Hours' },
    about: [
      'Software testing checks whether the actual results of a system match the expected results.',
      'It ensures the software system is defect-free, and helps identify errors, gaps or missing requirements against what was actually required.',
      'Testing can be carried out manually or using automated tools.'
    ],
    modules: [
      { name: 'Fundamentals of Java', hours: '40' },
      { name: 'Software Verification, Validation and Testing', hours: '24' },
      { name: 'Agile and DevOps', hours: '32' },
      { name: 'Functional Testing using Selenium', hours: '24' },
      { name: 'Mobile Testing', hours: '24' },
      { name: 'Project — Automation Testing', hours: '02' }
    ],
    softwareTraining: ['NetBeans', 'Selenium', 'Robotium', 'SOAP'],
    jobProfiles: ['Automation Tester', 'Mobile Tester']
  }
]
