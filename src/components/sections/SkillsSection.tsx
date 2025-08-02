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
          Math.min(containerRect.width, containerRect.height) * 0.32;

        const categoryCenterX =
          centerX + Math.cos(categoryAngle) * categoryRadius;
        const categoryCenterY =
          centerY + Math.sin(categoryAngle) * categoryRadius;

        categorySkills.forEach((skill, skillIndex) => {
          const skillAngleStep = (2 * Math.PI) / categorySkills.length;
          const skillAngle = skillIndex * skillAngleStep;
          // Adjust skill radius based on screen size
          const baseRadius = containerRect.width < 768 ? 80 : 120;
          const levelMultiplier = containerRect.width < 768 ? 25 : 40;
          const skillRadius = baseRadius + skill.level * levelMultiplier;

          const x = categoryCenterX + Math.cos(skillAngle) * skillRadius;
          const y = categoryCenterY + Math.sin(skillAngle) * skillRadius;

          const margin = containerRect.width < 768 ? 60 : 100;
          points.push({
            x: Math.max(margin, Math.min(containerRect.width - margin, x)),
            y: Math.max(margin, Math.min(containerRect.height - margin, y)),
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
            className="border-border relative h-[800px] w-full overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-50 to-blue-50 shadow-2xl sm:h-[1000px] md:h-[1200px] lg:h-[1400px] dark:from-slate-950 dark:to-blue-950"
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
                // Adjust connection distance based on container size
                const maxDistance = constellationRef.current
                  ? constellationRef.current.getBoundingClientRect().width < 768
                    ? 200
                    : 300
                  : 300;

                const connectedPoints = filteredPoints.filter(
                  (p) =>
                    p.category === point.category &&
                    p !== point &&
                    Math.sqrt(
                      Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
                    ) < maxDistance
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
                    strokeWidth="1.5"
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
                    whileHover={{ scale: 1.4 }}
                    className={`h-12 w-12 rounded-full bg-gradient-to-br sm:h-14 sm:w-14 md:h-16 md:w-16 ${categoryColors[point.category]} relative flex items-center justify-center border-2 border-white shadow-xl sm:border-3 dark:border-slate-900`}
                  >
                    {/* Pulsing Effect */}
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${categoryColors[point.category]} animate-ping opacity-20`}
                    />

                    {/* Level Indicator */}
                    <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-yellow-600 bg-yellow-400 text-xs font-bold text-yellow-900 shadow-lg sm:-top-2 sm:-right-2 sm:h-6 sm:w-6 sm:text-sm md:h-7 md:w-7">
                      {point.skill.level}
                    </div>

                    {/* Skill Name Inside Orb */}
                    <span className="relative z-10 truncate px-1 text-center text-xs leading-tight font-bold text-white sm:px-2 sm:text-sm">
                      {point.skill.name.length > 8
                        ? point.skill.name.substring(0, 6) + '...'
                        : point.skill.name}
                    </span>
                  </motion.div>

                  {/* Skill Tooltip */}
                  <AnimatePresence>
                    {hoveredSkill === point.skill.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -70, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="border-border absolute bottom-full left-1/2 z-20 mb-2 min-w-max -translate-x-1/2 transform rounded-xl border-2 bg-white px-6 py-4 shadow-2xl dark:bg-slate-800"
                      >
                        <div className="text-foreground text-lg font-bold">
                          {point.skill.name}
                        </div>
                        <div className="text-muted-foreground text-sm font-medium capitalize">
                          {point.category.replace('-', ' ')}
                        </div>
                        <div className="mt-2 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`mr-1 h-4 w-4 ${
                                i < point.skill.level
                                  ? 'fill-current text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-semibold text-yellow-600">
                            {point.skill.level}/5
                          </span>
                        </div>
                        {/* Tooltip Arrow */}
                        <div className="border-border absolute top-full left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 transform border-r-2 border-b-2 bg-white dark:bg-slate-800" />
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
