import {
  PersonalInfo,
  Project,
  Experience,
  Skill,
  SkillCategory,
  Achievement,
  Education,
} from '@/types';

export const personalInfo: PersonalInfo = {
  name: 'Mohammed Ibrahim Nasir',
  title: 'Software Engineer & Engineering Innovator',
  email: 'mibrahimnasir.engineer@gmail.com',
  bio: `Passionate Software Engineer and recent Computer Science graduate with expertise spanning multiple engineering domains. Known for adaptability, intuitive problem-solving, and leadership in technology initiatives. Experience in full-stack development, AI/ML, robotics, and team leadership.`,
  philosophy:
    'Technology should amplify human potential, not replace it. Every line of code I write is an opportunity to create meaningful impact and solve problems that matter.',
  profileImage: '/images/profile-ibrahim.jpg',
  resumeUrl: '/resume/ibrahim-nasir-resume.pdf',
  socialLinks: {
    github: 'https://github.com/MIbrahim-Nasir',
    linkedin: 'https://www.linkedin.com/in/mohammed-ibrahim-nasir/',
    whatsapp: '+91 8466820765',
  },
};

export const education: Education[] = [
  {
    degree: 'Bachelor of Engineering (B.E) in Computer Science and Engineering',
    institution: 'Muffakham Jah College Of Engineering and Technology',
    location: 'Hyderabad, India (Osmania University)',
    startDate: '2021',
    endDate: '2024',
    gpa: 8.27,
    achievements: [
      'Graduated with distinction GPA',
      'Vice Chair of TSIG (Technology Special Interest Group)',
      'Multiple hackathon winner',
      'Research paper published',
    ],
    relevantCoursework: [
      'Data Structures and Algorithms',
      'Object-Oriented Programming',
      'Database Management Systems',
      'Software Engineering',
      'Machine Learning',
      'Computer Networks',
      'Operating Systems',
    ],
  },
  {
    degree: 'Intermediate (11th & 12th Grade)',
    institution: 'Sri Chaitanya Junior College',
    location: 'India',
    startDate: '2019',
    endDate: '2021',
    gpa: 94, // Percentage
    achievements: ['94% in State Board Telangana examinations'],
  },
  {
    degree: '10th Grade (CBSE)',
    institution: 'New Indian Model School (NIMS)',
    location: 'Dubai, UAE',
    startDate: '2007',
    endDate: '2019',
    gpa: 92, // Percentage
    achievements: ['92% in CBSE 10th grade examinations'],
  },
];

export const experiences: Experience[] = [
  {
    id: 'deltax-intern',
    title: 'Associate Product Engineer Intern',
    company: 'DeltaX',
    location: 'Hyderabad, India',
    startDate: '2025-01',
    endDate: '2025-07',
    current: false,
    type: 'internship',
    description:
      'Worked on backend development using C# .NET, focusing on building scalable web applications and APIs.',
    achievements: [
      'Built complete IMDB backend system with database design and REST APIs',
      'Developed BookSwap application backend with recommendation engine',
      'Implemented Controller-Service-Repository architecture pattern',
      'Worked with MSSQL, Entity Framework Core, and Dapper',
      'Applied Dependency Injection and loose coupling principles',
    ],
    technologies: [
      'C#',
      '.NET',
      'ASP.NET Core',
      'Entity Framework Core',
      'Dapper',
      'SQL Server',
      'REST API',
      'Git',
    ],
  },
  {
    id: 'tsig-vice-chair',
    title: 'Vice Chair',
    company: 'TSIG - Technology Special Interest Group',
    location: 'MJCET, Hyderabad',
    startDate: '2024',
    endDate: '2025',
    current: false,
    type: 'leadership',
    description:
      'Led the most tech-intensive student organization in college, managing 25-30 members across multiple technology domains.',
    achievements: [
      'Managed club direction and vision across AI, ML, Web Dev, Robotics, and Cybersecurity',
      'Conducted month-long virtual frontend internship program',
      'Organized electronics workshops and technical events',
      'Guided juniors in placement preparation and technical skills',
      'Won multiple inter-college competitions and hackathons',
      'Increased club membership by 40% and project completion rate by 60%',
    ],
    technologies: [
      'Project Management',
      'Team Leadership',
      'Mentoring',
      'Technical Training',
      'Event Organization',
    ],
  },
  {
    id: 'tsig-tech-lead',
    title: 'Tech Lead',
    company: 'TSIG - Technology Special Interest Group',
    location: 'MJCET, Hyderabad',
    startDate: '2023',
    endDate: '2024',
    current: false,
    type: 'leadership',
    description:
      'Led technical projects and mentored team members while architecting complete project solutions from design to implementation.',
    achievements: [
      'Architected whole project ideas from design to implementation',
      'Led teams in hackathons and achieved multiple wins',
      'Mentored students in various technology domains',
      'Managed internal projects and technical workshops',
      'Contributed to web development, robotics, and AI projects',
    ],
    technologies: [
      'Web Development',
      'Robotics',
      'AI/ML',
      'Project Architecture',
      'Team Leadership',
    ],
  },
  {
    id: 'tsig-core-member',
    title: 'Mechatronics Core Member',
    company: 'TSIG - Technology Special Interest Group',
    location: 'MJCET, Hyderabad',
    startDate: '2022',
    endDate: '2023',
    current: false,
    type: 'leadership',
    description:
      'Started as Mechatronics Core member, working on robotics projects and learning multiple technology domains.',
    achievements: [
      'Built multiple robotics projects including mecanum car and 4DOF robotic arm',
      'Worked extensively with Arduino, ESP32, and various motor types',
      'Learned 3D modeling with OnShape and SolidWorks',
      'Contributed to web development projects using HTML, CSS, JavaScript',
      'Participated in hackathons and technical competitions',
    ],
    technologies: [
      'Arduino',
      'ESP32',
      'Robotics',
      '3D Modeling',
      'OnShape',
      'SolidWorks',
      'HTML',
      'CSS',
      'JavaScript',
    ],
  },
];

export const projects: Project[] = [
  {
    id: 'ai-robotics',
    title: 'AI LLM Robotics',
    description:
      'Robotic arm integrated with Google Gemini VLLM for intelligent decision making',
    longDescription:
      'A revolutionary project that gives a "brain" to robots by integrating Google\'s Gemini Vision Language Model. The system removes complex programming requirements by outsourcing decision-making to AI, allowing natural language control of robotic operations.',
    technologies: [
      'Python',
      'Google Gemini AI',
      'Arduino',
      'Computer Vision',
      'PySerial',
      'Robotics',
    ],
    category: 'ai-robotics',
    liveUrl:
      'https://www.linkedin.com/posts/mohammed-ibrahim-nasir_hackrev2025-ai-robotics-activity-7284575378826784770-dgCf?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEcXx2QBLGhFuJ8pgGARmMXqrW2HcYptb6I',
    imageUrl: '/images/projects/ai-robotics.jpg',
    videoUrl: '/videos/ai-robotics-demo.mp4',
    featured: true,
    completionDate: '2024-11',
    status: 'completed',
  },
  {
    id: 'gemini-computer-operator',
    title: 'Gemini Computer Operator',
    description: 'AI system for autonomous computer control using Gemini',
    longDescription:
      'Python program similar to Claude Computer Use, giving Gemini the ability to control a computer through mouse movements, clicks, browser control, and application management based on natural language commands.',
    technologies: [
      'Python',
      'Google Gemini',
      'Computer Vision',
      'Automation',
      'PyAutoGUI',
    ],
    category: 'automation',
    imageUrl: '/images/projects/computer-operator.jpg',
    featured: true,
    completionDate: '2024-09',
    status: 'completed',
  },
  {
    id: 'bookswap',
    title: 'BookSwap - Book Exchange Platform',
    description: 'eBay-style book exchange platform with recommendation engine',
    longDescription:
      'Full-featured book exchange platform where users can list, request, and trade books. Includes user management, book listing system, request handling, status tracking, and a custom recommendation engine based on user history and preferences.',
    technologies: [
      'C#',
      '.NET',
      'ASP.NET Core',
      'Entity Framework',
      'SQL Server',
      'Recommendation Algorithm',
    ],
    category: 'web-development',
    featured: true,
    completionDate: '2025-06',
    status: 'completed',
  },
  {
    id: 'data-science-algorithms',
    title: 'Fundamental ML Algorithm Programs',
    description:
      'Implementation of core machine learning algorithms from scratch',
    longDescription:
      'Comprehensive collection of fundamental machine learning algorithms implemented from scratch in Python, covering supervised and unsupervised learning techniques with detailed explanations and examples.',
    technologies: [
      'Python',
      'NumPy',
      'Pandas',
      'Matplotlib',
      'Machine Learning',
      'Data Science',
    ],
    category: 'machine-learning',
    githubUrl: 'https://github.com/MIbrahim-Nasir/Data-Science',
    featured: false,
    completionDate: '2024-05',
    status: 'completed',
  },
  {
    id: 'mecanum-car',
    title: 'Mecanum Car Controlled via Bluetooth',
    description:
      'Omnidirectional robot with bluetooth control and advanced movement capabilities',
    longDescription:
      'Advanced robotics project featuring mecanum wheels for omnidirectional movement, Arduino control, Bluetooth connectivity, CNC shield integration, and custom motor driver configuration for smooth directional control.',
    technologies: [
      'Arduino',
      'Mecanum Wheels',
      'Stepper Motors',
      'Bluetooth',
      'CNC Shield',
      'Motor Control',
    ],
    category: 'robotics',
    featured: false,
    completionDate: '2023-08',
    status: 'completed',
  },
  {
    id: 'core-xy-machine',
    title: 'Core XY Mechanism',
    description: 'Warehouse automation system with Core XY mechanism',
    longDescription:
      'Retail/warehouse item retrieval system using Core XY mechanism for precise positioning. Features stepper motors, timing belts, ESP32 control, and automated item picking functionality.',
    technologies: [
      'ESP32',
      'Stepper Motors',
      'Core XY Mechanism',
      'Timing Belts',
      'Automation',
    ],
    category: 'robotics',
    featured: true,
    completionDate: '2024-02',
    status: 'completed',
  },
  {
    id: 'atomic-sensei',
    title: 'Atomic Sensei',
    description:
      'AI-powered personalized education app with bite-sized learning',
    longDescription:
      'Full-stack AI education platform designed for the social media generation. Features byte-sized lessons, adaptive learning paths, strategic quizzes, and personalized content delivery. Uses agentic AI system with specialized agents for different educational tasks.',
    technologies: [
      'Full Stack Web',
      'AI Agents',
      'Personalization',
      'Adaptive Learning',
    ],
    category: 'web-development',
    githubUrl: 'https://github.com/MIbrahim-Nasir/Atomic_Sensei',
    imageUrl: '/images/projects/atomic-sensei.jpg',
    featured: true,
    completionDate: '2024-08',
    status: 'completed',
  },
  {
    id: 'lifehack-app',
    title: 'LifeHack',
    description: 'AI-powered food package analysis for health insights',
    longDescription:
      'Mobile app that uses Gemini API and Node.js to analyze food packages through images, providing health analytics, nutritional insights, and healthier alternative recommendations.',
    technologies: [
      'Node.js',
      'Google Gemini API',
      'Image Processing',
      'Health Analytics',
    ],
    category: 'mobile-app',
    githubUrl: 'https://github.com/MIbrahim-Nasir/LifeHack/',
    liveUrl: 'https://mibrahim-nasir.github.io/LifeHack/',
    featured: false,
    completionDate: '2024-07',
    status: 'completed',
  },
];

export const skills: Skill[] = [
  // Programming Languages
  {
    name: 'Python',
    category: 'programming',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 3,
  },
  {
    name: 'Java',
    category: 'programming',
    proficiency: 'intermediate',
    level: 3,
    yearsOfExperience: 2,
  },
  {
    name: 'C/C++',
    category: 'programming',
    proficiency: 'intermediate',
    level: 3,
    yearsOfExperience: 2,
  },
  {
    name: 'C#',
    category: 'programming',
    proficiency: 'advanced',
    level: 5,
    yearsOfExperience: 1,
  },
  {
    name: 'JavaScript',
    category: 'programming',
    proficiency: 'intermediate',
    level: 4,
    yearsOfExperience: 2,
  },
  {
    name: 'HTML/CSS',
    category: 'programming',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 2,
  },
  {
    name: 'Arduino',
    category: 'programming',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 2,
  },

  // Data Science & AI
  {
    name: 'NumPy',
    category: 'ai-ml',
    proficiency: 'intermediate',
    level: 3,
    yearsOfExperience: 2,
  },
  {
    name: 'Pandas',
    category: 'ai-ml',
    proficiency: 'intermediate',
    level: 3,
    yearsOfExperience: 2,
  },
  {
    name: 'Matplotlib',
    category: 'ai-ml',
    proficiency: 'intermediate',
    level: 3,
    yearsOfExperience: 2,
  },
  {
    name: 'Machine Learning',
    category: 'ai-ml',
    proficiency: 'intermediate',
    level: 3,
    yearsOfExperience: 1,
  },
  {
    name: 'Artificial Intelligence',
    category: 'ai-ml',
    proficiency: 'intermediate',
    level: 4,
    yearsOfExperience: 1,
  },

  // Backend & Frameworks
  {
    name: '.NET',
    category: 'frameworks',
    proficiency: 'advanced',
    level: 5,
    yearsOfExperience: 1,
  },
  {
    name: 'ASP.NET Core',
    category: 'frameworks',
    proficiency: 'advanced',
    level: 5,
    yearsOfExperience: 1,
  },
  {
    name: 'Entity Framework Core',
    category: 'frameworks',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 1,
  },
  {
    name: 'REST APIs',
    category: 'frameworks',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 1,
  },

  // Development Tools
  {
    name: 'VS Code',
    category: 'tools',
    proficiency: 'expert',
    level: 5,
    yearsOfExperience: 3,
  },
  {
    name: 'Visual Studio',
    category: 'tools',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 1,
  },
  {
    name: 'Git',
    category: 'tools',
    proficiency: 'intermediate',
    level: 4,
    yearsOfExperience: 2,
  },

  // Databases
  {
    name: 'SQL',
    category: 'databases',
    proficiency: 'intermediate',
    level: 4,
    yearsOfExperience: 1,
  },
  {
    name: 'MS SQL Server',
    category: 'databases',
    proficiency: 'intermediate',
    level: 4,
    yearsOfExperience: 1,
  },

  // AI Tools
  {
    name: 'ChatGPT',
    category: 'ai-ml',
    proficiency: 'advanced',
    level: 5,
    yearsOfExperience: 2,
  },
  {
    name: 'Google Gemini',
    category: 'ai-ml',
    proficiency: 'advanced',
    level: 5,
    yearsOfExperience: 1,
  },
  {
    name: 'Claude AI',
    category: 'ai-ml',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 1,
  },
  {
    name: 'GitHub Copilot',
    category: 'ai-ml',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 1,
  },
  {
    name: 'Cursor',
    category: 'tools',
    proficiency: 'intermediate',
    level: 3,
    yearsOfExperience: 0.5,
  },

  // Soft Skills
  {
    name: 'Leadership',
    category: 'soft-skills',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 3,
  },
  {
    name: 'Problem Solving',
    category: 'soft-skills',
    proficiency: 'expert',
    level: 5,
    yearsOfExperience: 5,
  },
  {
    name: 'Team Collaboration',
    category: 'soft-skills',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 3,
  },
  {
    name: 'Communication',
    category: 'soft-skills',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 3,
  },
  {
    name: 'Adaptability',
    category: 'soft-skills',
    proficiency: 'expert',
    level: 5,
    yearsOfExperience: 5,
  },
  {
    name: 'Mentoring',
    category: 'soft-skills',
    proficiency: 'advanced',
    level: 4,
    yearsOfExperience: 2,
  },
];

// Export SkillCategory for component use
export type { SkillCategory } from '@/types';

export const achievements: Achievement[] = [
  {
    id: 'research-paper',
    title: 'Published Research Paper in National Conference',
    description:
      'Published research paper on Core XY mechanism applications at National Conference',
    date: '2024-03',
    category: 'publication',
    organization: 'National Conference',
  },
  {
    id: 'hack-revolution',
    title: 'Hack Revolution Hackathon Winner',
    description:
      'Won hackathon for AI Robotics project using Google Gemini VLLM for robotic arm control',
    date: '2024-11',
    category: 'hackathon',
    organization: 'Hack Revolution',
    rank: 'Winner',
  },
  {
    id: 'hack4sdg-iit',
    title: 'IIT Hack4SDG Hackathon Special Mention',
    description:
      'Received special mention for retail/warehouse item retrieval machine using Core XY mechanism',
    date: '2024-02',
    category: 'hackathon',
    organization: 'IIT Hyderabad',
    rank: 'Special Mention',
  },
  {
    id: 'inter-club-debate',
    title: 'Inter Club Debate Champion',
    description: 'Won inter-club debate competition at MJCET',
    date: '2024-01',
    category: 'competition',
    organization: 'MJCET',
    rank: '1st Place',
  },
];

// Domain expertise areas for the 3D sphere
export const domains = [
  {
    id: 'ai-ml',
    name: 'Artificial Intelligence & ML',
    icon: 'brain',
    color: '#2563EB',
    projects: ['ai-robotics', 'atomic-sensei', 'lifehack-app', 'rag-app'],
    skills: [
      'Python',
      'Google Gemini API',
      'Machine Learning',
      'Prompt Engineering',
    ],
  },
  {
    id: 'web-development',
    name: 'Web Development',
    icon: 'code',
    color: '#F97316',
    projects: [
      'webprint-vscode',
      'atomic-sensei',
      'deltax-imdb',
      'deltax-bookswap',
    ],
    skills: ['JavaScript', 'C#', '.NET', 'React', 'Node.js'],
  },
  {
    id: 'robotics',
    name: 'Robotics & Mechatronics',
    icon: 'robot',
    color: '#7C3AED',
    projects: [
      'ai-robotics',
      'mecanum-car',
      'robotic-arm-4dof',
      'core-xy-machine',
    ],
    skills: ['Arduino', 'ESP32', 'Robotics', '3D Printing', 'Motor Control'],
  },
  {
    id: 'backend',
    name: 'Backend Development',
    icon: 'server',
    color: '#10B981',
    projects: ['deltax-imdb', 'deltax-bookswap', 'lifehack-app'],
    skills: ['C#', '.NET', 'ASP.NET Core', 'SQL Server', 'REST API'],
  },
  {
    id: 'leadership',
    name: 'Leadership & Management',
    icon: 'users',
    color: '#FBBF24',
    projects: [],
    skills: [
      'Team Management',
      'Project Management',
      'Mentoring',
      'Leadership',
    ],
  },
  {
    id: 'automation',
    name: 'Automation & Tools',
    icon: 'settings',
    color: '#0EA5E9',
    projects: ['gemini-computer-operator', 'web-scraper'],
    skills: ['Python', 'Automation', 'Web Scraping', 'Computer Vision'],
  },
];
