export const site = {
  name: 'Mohammed Ibrahim Nasir',
  given: 'Ibrahim',
  family: 'Nasir',
  title: 'AI Developer',
  location: 'Dubai',
  email: 'mibrahimnasir.engineer@gmail.com',
  phone: '050 576 3323',
  resumeUrl: '/resume.pdf',
  social: {
    github: 'https://github.com/MIbrahim-Nasir',
    linkedin: 'https://www.linkedin.com/in/mohammed-ibrahim-nasir/',
  },
  opening: {
    line: 'I ship GenAI into live design work.',
    body: 'Engineer first. 2+ years in the field, now an AI Developer in Dubai. I like systems that think and systems that move: RAG and agents on one side, motors and boards on the other.',
  },
  intro: [
    { k: 'Now', v: 'AI Developer at Ducon Industries, Dubai' },
    { k: 'Before', v: 'Product Engineer intern at DeltaX, Hyderabad' },
    { k: 'School', v: 'NIMS Dubai, then BE CSE, Osmania, 2025' },
    { k: 'Club', v: 'TSIG Vice Chair. About thirty people.' },
  ],
  work: [
    {
      id: 'ducon-genai',
      label: 'Design GenAI',
      place: 'Ducon Industries',
      year: '2025',
      summary:
        'An internal system for outdoor-living designers. Catalogue RAG, multimodal agents, image generation, eval gates. FastAPI and React on a VPS. I designed the architecture. Implementation is largely AI-assisted.',
      outcome:
        'Used live with clients in the showroom. A 30 to 45 minute sketch loop now starts from a generated plan.',
      stack: ['Python', 'FastAPI', 'RAG', 'Gemini', 'Langfuse', 'React', 'R2'],
      image: '/images/work-ducon.jpg',
    },
    {
      id: 'invoice',
      label: 'Invoice Extractor',
      place: 'Personal build',
      year: '2025',
      summary:
        'A vision model reads an invoice and returns strict JSON. Pydantic holds the schema so fields do not drift.',
      outcome: 'High field accuracy on the samples I tested.',
      stack: ['LangChain', 'Gemini Vision', 'Pydantic', 'Streamlit'],
      image: '/images/work-invoice.jpg',
    },
    {
      id: 'robotics',
      label: 'Vision Arm',
      place: 'Hackathon',
      year: '2024',
      summary:
        'Camera to Gemini Vision. The model decides grasp and place. Motors follow over serial. The microcontroller stops pretending to be a brain.',
      outcome: 'Third place, national hackathon.',
      stack: ['Python', 'Gemini Vision', 'Arduino', 'PySerial'],
      image: '/images/work-arm.jpg',
    },
    {
      id: 'atomic-sensei',
      label: 'Atomic Sensei',
      place: 'Personal build',
      year: '2024',
      summary:
        'A multi-agent learning app: bite-sized lessons, adaptive paths, quizzes. I designed the architecture. Most of the implementation was AI-assisted.',
      outcome: 'A working prototype, not a production claim.',
      stack: ['AI Agents', 'Full stack', 'Personalization'],
      image: '/images/work-sensei.jpg',
      href: 'https://github.com/MIbrahim-Nasir/Atomic_Sensei',
    },
  ],
  layers: [
    {
      name: 'Mind',
      body: 'How the system thinks. Retrieval, agents, eval, traces. I design the loop, then I make the model stay inside it.',
      items: [
        {
          name: 'RAG',
          note: 'Embeddings over messy architectural catalogues, then search that sounds like speech.',
        },
        {
          name: 'Agents',
          note: 'Multimodal steps with retries and quality gates before an image is shown.',
        },
        {
          name: 'Eval',
          note: 'If it fails the check, it does not ship to the designer.',
        },
        {
          name: 'Traces',
          note: 'Langfuse and LangSmith so I can see where a run went wrong.',
        },
        {
          name: 'LoRA',
          note: 'Tried on master-plan images. Scrapped. I keep the lesson, not the claim.',
        },
      ],
    },
    {
      name: 'Machine',
      body: 'How the system holds. APIs, storage, keys, a VPS that stays up. The model is useless if the service is not.',
      items: [
        {
          name: 'FastAPI',
          note: 'Python services for RAG, agents, and image jobs.',
        },
        {
          name: '.NET',
          note: 'Two production backends at DeltaX. Twenty-plus APIs. Rusty now, still how I learned services.',
        },
        {
          name: 'SQL',
          note: 'Recommendation engine and relational data, not just vectors.',
        },
        {
          name: 'Docker',
          note: 'Local model serving that repeats the same way twice.',
        },
        {
          name: 'React',
          note: 'Internal designer canvas. Built with AI tools, wired to real APIs.',
        },
      ],
    },
    {
      name: 'Matter',
      body: 'How the system moves. Arms, boards, print beds. If it has mass, I can reason about it.',
      items: [
        {
          name: 'Vision',
          note: 'Camera in, action out. The model sees. The motors obey.',
        },
        {
          name: 'Serial',
          note: 'Arduino and steppers. Commands that actually fire.',
        },
        {
          name: 'Print',
          note: 'Core XY and print beds. Mechanical constraints first.',
        },
        {
          name: 'Boards',
          note: 'Sensors, wiring, and the gap between a notebook and a bench.',
        },
      ],
    },
  ],
  record: [
    {
      label: 'Ducon',
      role: 'AI Developer',
      org: 'Ducon Industries',
      place: 'Dubai',
      dates: 'Aug 2025 - Present',
      focus: 'Production GenAI for outdoor-living designers.',
      stack: ['Python', 'FastAPI', 'RAG', 'Gemini', 'Langfuse', 'React'],
      points: [
        'Shipped the internal design GenAI used in the showroom with clients.',
        'RAG over unstructured architectural assets, then search in natural language.',
        'Agents with quality gates and retries. Traces in Langfuse.',
        'FastAPI and React on a VPS. Cloudflare R2 for generated images. Keys per user.',
      ],
    },
    {
      label: 'DeltaX',
      role: 'Product Engineer Intern',
      org: 'DeltaX',
      place: 'Hyderabad',
      dates: 'Jan 2025 - Jul 2025',
      focus: 'Production backends before the GenAI work.',
      stack: ['C#', '.NET Core', 'SQL Server'],
      points: [
        'Two production backends: an IMDB-style service and BookSwap.',
        'Twenty-plus REST APIs.',
        'A recommendation engine on SQL Server.',
      ],
    },
    {
      label: 'TSIG',
      role: 'Vice Chair',
      org: 'TSIG, MJCET',
      place: 'Hyderabad',
      dates: '2022 - 2025',
      focus: 'A student engineering club run like a workshop.',
      stack: ['Robotics', 'Mentoring', 'Web'],
      points: [
        'Rose from core member to Vice Chair.',
        'About thirty people across AI, robotics, and web.',
        'Workshops, a virtual internship, and a clearer way to finish work.',
      ],
    },
    {
      label: 'School',
      role: 'B.E. Computer Science',
      org: 'MJCET, Osmania University',
      place: 'Hyderabad',
      dates: '2021 - 2025',
      focus: 'Degree in parallel with the club that actually trained me.',
      stack: ['CSE', 'Robotics'],
      points: [
        'B.E. Computer Science, Osmania University, 2025. GPA around 8.27.',
        'School through 10th in Dubai. Then Hyderabad for intermediate and university.',
        'The bench work lived in TSIG more than in the lecture hall.',
      ],
    },
  ],
  education: {
    degree: 'B.E. Computer Science',
    school: 'MJCET, Osmania University',
  },
} as const;
