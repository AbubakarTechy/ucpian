export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const getNoteFileUrl = (noteId) => `${API_URL}/api/notes/${noteId}/file`;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const APP_NAME = 'CampusNotes';

export const OTHERS_FOLDER = 'Others';

export const SEMESTERS_MAP = {
  '1st': [
    'Introduction to Computing',
    'Basic Electronics',
    'Islamic Studies',
    'English Composition & Comprehension (ENG-I)',
    'Pakistan Studies'
  ],
  '2nd': [
    'Programming Fundamentals',
    'Communication & Presentation Skills (ENG-II)',
    'Discrete Structures',
    'Software Engineering',
    'Calculus & Analytical Geometry'
  ],
  '3rd': [
    'Object Oriented Programming (OOP)',
    'Software Requirement Engineering',
    'Database Systems',
    'Linear Algebra'
  ],
  '4th': [
    'Data Structures & Algorithms (DSA)',
    'Software Design & Architecture',
    'Probability & Statistics',
    'Web Engineering',
    'Technical & Business Writing'
  ],
  '5th': [
    'Operating Systems',
    'Human Computer Interaction (HCI)',
    'Business Process Engineering'
  ],
  '6th': [
    'Computer Networks',
    'Software Construction & Development',
    'Formal Methods in Software Engineering'
  ],
  '7th': [
    'Information Security',
    'Software Project Management',
    'Software Re-Engineering'
  ],
  '8th': [
    'Professional Practices',
    'Software Quality Engineering',
    'Operations Research / Stochastic Processes'
  ]
};

export const getSemesterSubjects = (semester) => [
  ...(SEMESTERS_MAP[semester] || []),
  OTHERS_FOLDER
];
