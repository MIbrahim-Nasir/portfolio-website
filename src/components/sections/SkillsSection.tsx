'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Star,
  Code,
  Database,
  Globe,
  Brain,
  Wrench,
  Palette,
} from 'lucide-react';
import { skills, SkillCategory } from '@/data/portfolio-data';
import { Skill } from '@/types';

interface ConstellationPoint {
  x: number;
  y: number;
  skill: Skill;
  category: SkillCategory;
}

const categoryIcons: Record<SkillCategory, typeof Code> = {
  programming: Code,
  frameworks: Globe,
  databases: Database,
  'ai-ml': Brain,
  tools: Wrench,
  design: Palette,
  'soft-skills': Star,
};

const categoryColors: Record<SkillCategory, string> = {
  programming: 'from-blue-500 to-cyan-500',
  frameworks: 'from-green-500 to-emerald-500',
  databases: 'from-purple-500 to-violet-500',
  'ai-ml': 'from-orange-500 to-red-500',
  tools: 'from-yellow-500 to-orange-500',
  design: 'from-pink-500 to-rose-500',
  'soft-skills': 'from-indigo-500 to-purple-500',
};

export default function SkillsSection() {
  const [selectedCategory, setSelectedCategory] = useState<
    SkillCategory | 'all'
  >('all');
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [constellationPoints, setConstellationPoints] = useState<
    ConstellationPoint[]
  >([]);

  const sectionRef = useRef<HTMLElement>(null);
  const constellationRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  // Generate constellation points
  useEffect(() => {
    if (!constellationRef.current || typeof window === 'undefined') return;

    const containerRect = constellationRef.current.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const points: ConstellationPoint[] = [];

    // Group skills by category
    const skillsByCategory = skills.reduce(
      (acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
      },
      {} as Record<SkillCategory, typeof skills>
    );

    // Position skills in constellation patterns
    Object.entries(skillsByCategory).forEach(
      ([category, categorySkills], categoryIndex) => {
        const angleStep = (2 * Math.PI) / Object.keys(skillsByCategory).length;
        const categoryAngle = categoryIndex * angleStep;
        const categoryRadius =
          Math.min(containerRect.width, containerRect.height) * 0.25;

        const categoryCenterX =
          centerX + Math.cos(categoryAngle) * categoryRadius;
        const categoryCenterY =
          centerY + Math.sin(categoryAngle) * categoryRadius;

        categorySkills.forEach((skill, skillIndex) => {
          const skillAngleStep = (2 * Math.PI) / categorySkills.length;
          const skillAngle = skillIndex * skillAngleStep;
          const skillRadius = 60 + skill.level * 20;

          const x = categoryCenterX + Math.cos(skillAngle) * skillRadius;
          const y = categoryCenterY + Math.sin(skillAngle) * skillRadius;

          points.push({
            x: Math.max(50, Math.min(containerRect.width - 50, x)),
            y: Math.max(50, Math.min(containerRect.height - 50, y)),
            skill,
            category: category as SkillCategory,
          });
        });
      }
    );

    setConstellationPoints(points);
  }, [isInView]);

  const filteredPoints =
    selectedCategory === 'all'
      ? constellationPoints
      : constellationPoints.filter(
          (point) => point.category === selectedCategory
        );

  const categories = Object.keys(categoryIcons) as SkillCategory[];

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="from-background via-muted/5 to-background dark:from-background dark:via-muted/10 dark:to-background bg-gradient-to-b py-20 lg:py-32"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center lg:mb-24"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4 text-lg font-medium text-blue-600 dark:text-blue-400"
          >
            Technical Expertise
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Skills <span className="gradient-text">Constellation</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed"
          >
            Explore my technical universe where each skill represents a star in
            my constellation of expertise. From programming languages to AI
            frameworks, discover the technologies that power my innovations.
          </motion.p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-12 flex flex-wrap justify-center gap-3 lg:mb-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full border-2 px-6 py-3 font-medium transition-all ${
              selectedCategory === 'all'
                ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                : 'text-foreground border-border bg-white/50 hover:border-blue-300 dark:bg-white/5 dark:hover:border-blue-700'
            }`}
          >
            <Star className="mr-2 inline h-4 w-4" />
            All Skills
          </motion.button>

          {categories.map((category, index) => {
            const Icon = categoryIcons[category];
            return (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border-2 px-4 py-3 font-medium transition-all ${
                  selectedCategory === category
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                    : 'text-foreground border-border bg-white/50 hover:border-blue-300 dark:bg-white/5 dark:hover:border-blue-700'
                }`}
              >
                <Icon className="mr-2 inline h-4 w-4" />
                {category
                  .split('-')
                  .map(
                    (word: string) =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                  )
                  .join(' ')}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Constellation Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="relative"
        >
          <div
            ref={constellationRef}
            className="border-border relative h-[600px] w-full overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 to-blue-50 shadow-2xl lg:h-[700px] dark:from-slate-950 dark:to-blue-950"
          >
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid h-full w-full grid-cols-12 grid-rows-12">
                {[...Array(144)].map((_, i) => (
                  <div key={i} className="border-border/30 border" />
                ))}
              </div>
            </div>

            {/* Constellation Lines */}
            <svg className="absolute inset-0 h-full w-full">
              {filteredPoints.map((point, index) => {
                const connectedPoints = filteredPoints.filter(
                  (p) =>
                    p.category === point.category &&
                    Math.sqrt(
                      Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
                    ) < 150
                );

                return connectedPoints.map((connectedPoint, connectedIndex) => (
                  <motion.line
                    key={`${index}-${connectedIndex}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    transition={{ duration: 1.5, delay: 1.5 + index * 0.1 }}
                    x1={point.x}
                    y1={point.y}
                    x2={connectedPoint.x}
                    y2={connectedPoint.y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-blue-400 dark:text-blue-600"
                  />
                ));
              })}
            </svg>

            {/* Skill Points */}
            <AnimatePresence>
              {filteredPoints.map((point, index) => (
                <motion.div
                  key={`${point.skill.name}-${selectedCategory}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.5, delay: 1.8 + index * 0.05 }}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 transform cursor-pointer"
                  style={{ left: point.x, top: point.y }}
                  onMouseEnter={() => setHoveredSkill(point.skill.name)}
                  onMouseLeave={() => setHoveredSkill(null)}
                >
                  {/* Skill Orb */}
                  <motion.div
                    whileHover={{ scale: 1.3 }}
                    className={`h-6 w-6 rounded-full bg-gradient-to-br ${categoryColors[point.category]} relative border-2 border-white shadow-lg dark:border-slate-900`}
                  >
                    {/* Pulsing Effect */}
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${categoryColors[point.category]} animate-ping opacity-60`}
                    />

                    {/* Level Indicator */}
                    <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full border border-yellow-600 bg-yellow-400 text-xs font-bold text-yellow-900">
                      {point.skill.level}
                    </div>
                  </motion.div>

                  {/* Skill Tooltip */}
                  <AnimatePresence>
                    {hoveredSkill === point.skill.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -50, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="border-border absolute bottom-full left-1/2 z-10 mb-2 min-w-max -translate-x-1/2 transform rounded-lg border bg-white px-4 py-2 shadow-xl dark:bg-slate-800"
                      >
                        <div className="text-foreground text-sm font-semibold">
                          {point.skill.name}
                        </div>
                        <div className="text-muted-foreground text-xs capitalize">
                          {point.category.replace('-', ' ')}
                        </div>
                        <div className="mt-1 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < point.skill.level
                                  ? 'fill-current text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {/* Tooltip Arrow */}
                        <div className="border-border absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform border-r border-b bg-white dark:bg-slate-800" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Floating Elements */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-blue-400/30 dark:bg-blue-600/30"
                animate={{
                  x: [0, 30, -30, 0],
                  y: [0, -30, 30, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${15 + i * 8}%`,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Skills Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 2 }}
          className="mt-16 grid grid-cols-2 gap-6 lg:mt-24 lg:grid-cols-4"
        >
          {categories.map((category, index) => {
            const Icon = categoryIcons[category];
            const categorySkills = skills.filter(
              (skill) => skill.category === category
            );

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 2.2 + index * 0.1 }}
                className="border-border rounded-2xl border bg-white/50 p-6 text-center backdrop-blur-sm transition-transform hover:scale-105 dark:bg-white/5"
              >
                <Icon className="mx-auto mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="text-foreground mb-1 text-2xl font-bold">
                  {categorySkills.length}
                </div>
                <div className="text-muted-foreground text-sm font-medium capitalize">
                  {category.replace('-', ' ')}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
