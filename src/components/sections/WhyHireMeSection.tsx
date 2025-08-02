'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Target,
  TrendingUp,
  Award,
  Code,
  Users,
  Lightbulb,
  Rocket,
  Brain,
  Star,
} from 'lucide-react';

const highlights = [
  {
    icon: Zap,
    title: 'Engineering Fanatic',
    description:
      'Extreme passion for all engineering domains with insatiable curiosity for innovation',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Brain,
    title: 'Rapid Learner',
    description:
      'Quick adaptation to new technologies and frameworks with proven track record',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Code,
    title: 'Technical Versatility',
    description:
      'Expert in Python, C#, .NET, AI/ML with full-stack development capabilities',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Leadership Experience',
    description:
      'Proven leadership in TSIG and team management across multiple projects',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Lightbulb,
    title: 'Innovation Mindset',
    description:
      'Passionate about creating helpful solutions that make a real-world impact',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Target,
    title: 'Result-Oriented',
    description:
      'Focused on delivering high-quality solutions that exceed expectations',
    color: 'from-red-500 to-pink-500',
  },
];

const techStack = [
  { name: 'Python', level: 95, color: 'bg-yellow-500' },
  { name: 'C# & .NET', level: 90, color: 'bg-purple-500' },
  { name: 'AI/ML', level: 88, color: 'bg-blue-500' },
  { name: 'Full-Stack', level: 85, color: 'bg-green-500' },
  { name: 'Leadership', level: 92, color: 'bg-red-500' },
  { name: 'Innovation', level: 98, color: 'bg-pink-500' },
];

export default function WhyHireMeSection() {
  return (
    <section
      id="why-hire-me"
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4 inline-block"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Rocket className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-4 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Why{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Hire Me?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto max-w-6xl px-4 text-lg leading-[1.5] font-medium tracking-wide text-gray-100 sm:px-0 sm:text-xl sm:leading-[1.6] md:text-2xl lg:text-3xl"
          >
            <span className="text-xl font-bold text-purple-300 sm:text-2xl md:text-3xl lg:text-4xl">
              Why me?
            </span>{' '}
            Because you&apos;re not just getting a developer who knows a
            specific stack; you&apos;re getting a{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-bold text-transparent">
              dedicated engineering fanatic
            </span>{' '}
            who thrives on{' '}
            <span className="font-semibold text-cyan-400">
              deconstructing complex problems
            </span>
            . This
            <span className="font-bold text-yellow-400">
              {' '}
              deep curiosity is my superpower
            </span>
            ; it allows me to learn new technologies
            <span className="font-semibold text-green-400">
              {' '}
              intuitively and at extreme speed
            </span>
            . I proved this by
            <span className="font-semibold text-blue-400">
              {' '}
              mastering an enterprise .NET environment
            </span>{' '}
            for my internship and by
            <span className="font-semibold text-purple-400">
              {' '}
              leading teams to win hackathons
            </span>{' '}
            with AI-robotics projects—often learning the core concepts in
            <span className="font-bold text-pink-400"> a single weekend</span>.
            So when you hire me, you&apos;re investing in
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text font-bold text-transparent">
              {' '}
              true adaptability
            </span>
            . Give me your toughest challenge; I am ready to learn whatever it
            takes—from a new cloud service to hardware integration—to build your
            <span className="font-bold text-yellow-300">
              {' '}
              next great solution
            </span>
            .
          </motion.p>
        </motion.div>

        {/* Main Pitch Content */}
        <div className="mb-20 grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Key Highlights */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-8 flex items-center text-3xl font-bold text-white">
              <Star className="mr-3 h-8 w-8 text-yellow-400" />
              Core Strengths
            </h3>

            <div className="space-y-6">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`rounded-xl bg-gradient-to-r p-3 ${highlight.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <highlight.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-2 text-xl font-semibold text-white">
                        {highlight.title}
                      </h4>
                      <p className="leading-relaxed text-gray-300">
                        {highlight.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Skills & Experience */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="mb-8 flex items-center text-3xl font-bold text-white">
              <TrendingUp className="mr-3 h-8 w-8 text-green-400" />
              Expertise Level
            </h3>

            <div className="space-y-6">
              {techStack.map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-medium text-white">
                      {tech.name}
                    </span>
                    <span className="text-sm font-bold text-gray-300">
                      {tech.level}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-700">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${tech.level}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                      className={`h-full ${tech.color} rounded-full shadow-lg transition-shadow duration-300 group-hover:shadow-xl`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Experience Highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-8"
            >
              <div className="mb-4 flex items-center">
                <Award className="mr-3 h-8 w-8 text-yellow-400" />
                <h4 className="text-2xl font-bold text-white">
                  Leadership Impact
                </h4>
              </div>
              <p className="leading-relaxed text-gray-300">
                Led TSIG initiatives, managed cross-functional teams, and
                delivered innovative solutions that improved efficiency by 40%
                while maintaining high-quality standards. Experienced in
                mentoring junior developers and driving technical excellence.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <div className="inline-block rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-8 backdrop-blur-sm">
            <h3 className="mb-4 text-2xl font-bold text-white">
              Ready to Build Something Amazing Together?
            </h3>
            <p className="mx-auto mb-6 max-w-2xl text-gray-300">
              Let&apos;s combine my engineering passion with your vision to
              create innovative solutions that make a real impact.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:shadow-purple-500/25"
              onClick={() => {
                const element = document.querySelector('#contact');
                if (element) {
                  element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }
              }}
            >
              Let&apos;s Connect & Collaborate 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
