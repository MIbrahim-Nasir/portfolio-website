// Global type definitions for the portfolio website

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  technologies: string[];
  category: ProjectCategory;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  featured: boolean;
  completionDate: string;
  status: 'completed' | 'in-progress' | 'planned';
}

export type ProjectCategory =
  | 'ai-robotics'
  | 'web-development'
  | 'mobile-app'
  | 'machine-learning'
  | 'robotics'
  | 'extension'
  | 'automation';

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
  type: 'internship' | 'full-time' | 'part-time' | 'volunteer' | 'leadership';
}

export interface Skill {
  name: string;
  category: SkillCategory;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  level: number; // 1-5 rating for visualization
  yearsOfExperience: number;
  projects?: string[]; // Project IDs where this skill was used
}

export type SkillCategory =
  | 'programming'
  | 'frameworks'
  | 'databases'
  | 'tools'
  | 'ai-ml'
  | 'design'
  | 'soft-skills';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: AchievementCategory;
  organization?: string;
  certificateUrl?: string;
  rank?: string;
  participants?: number;
}

export type AchievementCategory =
  | 'hackathon'
  | 'competition'
  | 'certification'
  | 'publication'
  | 'award'
  | 'recognition';

export interface Education {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: number;
  achievements?: string[];
  relevantCoursework?: string[];
}

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  bio: string;
  philosophy?: string;
  profileImage?: string;
  resumeUrl?: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
    whatsapp?: string;
  };
}

// Animation and UI types
export interface AnimationConfig {
  duration: number;
  delay?: number;
  ease?: string;
  repeat?: number;
}

export interface ThreeDObject {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface InteractiveElement {
  id: string;
  type: 'sphere' | 'particle' | 'icon' | 'text';
  position: ThreeDObject;
  animation?: AnimationConfig;
  onClick?: () => void;
  onHover?: () => void;
}

// Navigation and routing
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
}

export interface Section {
  id: string;
  title: string;
  component: string;
  visible: boolean;
  order: number;
}

// Form types
export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'textarea' | 'select';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

// Theme and styling
export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  animations: {
    fastTransition: string;
    normalTransition: string;
    slowTransition: string;
  };
}

// API and data fetching
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface LoadingState<T = unknown> {
  isLoading: boolean;
  error?: string;
  data?: T;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
