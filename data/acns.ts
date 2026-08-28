// Structured curriculum data for the Aptech Certified Network Specialist
// (ACNS) page — Aptech Hardware & Networking Academy, product note
// ACNS-OV-7080. Transcribed from the official APTECH programme material
// supplied for reference — content only, no source imagery is used.

export type AcnsModule = {
  name: string
  hours: string
  theory: string
  lab: string
  selfStudy: string
  tool?: string
  certification?: string
}

export type AcnsTerm = {
  id: string
  label: string
  totalHours: string
  theoryTotal: string
  labTotal: string
  selfStudyTotal: string
  exitProfile: string
  modules: AcnsModule[]
}

export const acnsTerms: AcnsTerm[] = [
  {
    id: 'term-1',
    label: 'Term 1',
    totalHours: '152',
    theoryTotal: '92',
    labTotal: '60',
    selfStudyTotal: '46',
    exitProfile: 'IT Technician',
    modules: [
      { name: 'Digital Electronics', hours: '32', theory: '32', lab: '0', selfStudy: '10' },
      {
        name: 'Hardware, Networking & Troubleshooting',
        hours: '36', theory: '18', lab: '18', selfStudy: '10',
        tool: 'Windows OS', certification: 'CompTIA A+ (Exam-200-1101)'
      },
      {
        name: 'Installing and Configuring Operating Systems',
        hours: '36', theory: '18', lab: '18', selfStudy: '10',
        tool: 'Windows OS', certification: 'CompTIA A+ (Exam-200-1102)'
      },
      {
        name: 'Technologies of Computer Networks',
        hours: '40', theory: '20', lab: '20', selfStudy: '12',
        tool: 'Network Tools', certification: 'CompTIA Network+ (Exam-N10-009)'
      },
      {
        name: 'Emerging Job Areas — SMAC',
        hours: '08', theory: '04', lab: '04', selfStudy: '04',
        tool: 'Cloud Tools'
      }
    ]
  },
  {
    id: 'term-2',
    label: 'Term 2',
    totalHours: '176',
    theoryTotal: '78',
    labTotal: '98',
    selfStudyTotal: '54',
    exitProfile: 'Network Administrator',
    modules: [
      {
        name: 'Manage Modern Desktops with Windows',
        hours: '40', theory: '20', lab: '20', selfStudy: '12',
        tool: 'Windows 11', certification: 'Exam MD-100: Windows 10'
      },
      {
        name: 'Fundamentals of Red Hat System Administration',
        hours: '32', theory: '16', lab: '16', selfStudy: '10',
        tool: 'RHEL 8.2', certification: 'Red Hat Certified System Administrator (RHCSA) — Exam EX200'
      },
      {
        name: 'Implementing and Administering Network Solutions',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Graphical Network Simulator-3 (GNS3) or any other router simulation software',
        certification: 'CCNA (Exam 200-301)'
      },
      {
        name: 'Cybersecurity Operations Fundamentals',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Graphical Network Simulator-3 (GNS3) or any other router simulation software',
        certification: 'Cisco Certified CyberOps Associate (200-201 CBROPS)'
      },
      {
        name: 'eProject — Administering Network Solutions',
        hours: '24', theory: '02', lab: '22', selfStudy: '00'
      }
    ]
  },
  {
    id: 'term-3',
    label: 'Term 3',
    totalHours: '180',
    theoryTotal: '80',
    labTotal: '100',
    selfStudyTotal: '58',
    exitProfile: 'Windows Azure Administrator',
    modules: [
      {
        name: 'Azure Fundamentals',
        hours: '36', theory: '18', lab: '18', selfStudy: '10',
        tool: 'Microsoft Windows Azure', certification: 'Microsoft Certified: Azure Fundamentals AZ-900'
      },
      {
        name: 'Implementing, Managing and Monitoring Azure Environment',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Microsoft Windows Azure', certification: 'Microsoft Certified: Azure Administrator Associate AZ-104'
      },
      {
        name: 'Azure Architect Technologies',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Microsoft Windows Azure', certification: 'Microsoft Azure Architect Technologies AZ-800'
      },
      {
        name: 'Azure Solutions Architect Design',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Microsoft Windows Azure', certification: 'Microsoft Azure Architect Design AZ-801'
      },
      {
        name: 'Project — Azure Administration',
        hours: '24', theory: '02', lab: '22', selfStudy: '00'
      }
    ]
  },
  {
    id: 'term-4',
    label: 'Term 4',
    totalHours: '184',
    theoryTotal: '94',
    labTotal: '90',
    selfStudyTotal: '58',
    exitProfile: 'Network Engineer / Ethical Hacker',
    modules: [
      { name: 'Information Security & Organizational Structure', hours: '32', theory: '32', lab: '0', selfStudy: '10' },
      {
        name: 'Implementing and Operating Enterprise Network Core Technologies (ENCOR)',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Graphical Network Simulator-3 (GNS3) or any other router simulation software',
        certification: 'CCNP Enterprise Core (Exam 350-401 ENCOR)'
      },
      {
        name: 'Implementing Enterprise Advanced Routing and Services (ENARSI)',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Graphical Network Simulator-3 (GNS3) or any other router simulation software',
        certification: 'CCNP Enterprise Concentration (Exam 300-410 ENARSI)'
      },
      {
        name: 'Ethical Hacking',
        hours: '40', theory: '20', lab: '20', selfStudy: '16',
        tool: 'Ethical Hacking Tools', certification: 'Certified Ethical Hacker (CEH v11)'
      },
      {
        name: 'Project — Ethical Hacking',
        hours: '32', theory: '02', lab: '30', selfStudy: '00'
      }
    ]
  }
]

export const acnsProgrammeTotalHours = acnsTerms
  .reduce((sum, t) => sum + parseInt(t.totalHours, 10), 0)
  .toString()
