'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Github,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { projects } from '@/data/portfolio-data';
import { Project, ProjectCategory } from '@/types';

const categoryLabels: Record<ProjectCategory, string> = {
  'ai-robotics': 'AI & Robotics',
  'web-development': 'Web Development',
  'mobile-app': 'Mobile Apps',
  'machine-learning': 'Machine Learning',
  robotics: 'Robotics',
  extension: 'Extensions',
  automation: 'Automation',
};

const categoryColors: Record<ProjectCategory, string> = {
  'ai-robotics': 'from-orange-500 to-red-500',
  'web-development': 'from-blue-500 to-cyan-500',
  'mobile-app': 'from-green-500 to-emerald-500',
  'machine-learning': 'from-purple-500 to-violet-500',
  robotics: 'from-yellow-500 to-orange-500',
  extension: 'from-pink-500 to-rose-500',
  automation: 'from-indigo-500 to-blue-500',
};

export default function ProjectsSection() {
  const [selectedCategory, setSelectedCategory] = useState<
    ProjectCategory | 'all'
  >('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  // Filter projects based on category and featured status
  const filteredProjects =
    selectedCategory === 'all'
      ? projects.filter((project) => project.featured)
      : projects.filter((project) => project.category === selectedCategory);

  const displayProjects =
    filteredProjects.length > 0 ? filteredProjects : projects.slice(0, 6);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || displayProjects.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayProjects.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayProjects.length]);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % displayProjects.length);
    setIsAutoPlaying(false);
  };

  const prevProject = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + displayProjects.length) % displayProjects.length
    );
    setIsAutoPlaying(false);
  };

  const goToProject = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const getVisibleProjects = () => {
    const visible = [];
    const total = displayProjects.length;

    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + total) % total;
      visible.push({
        project: displayProjects[index],
        offset: i,
        index: index,
      });
    }

    return visible;
  };

  const categories = Object.keys(categoryLabels) as ProjectCategory[];

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="from-muted/5 via-background to-muted/5 dark:from-muted/10 dark:via-background dark:to-muted/10 bg-gradient-to-b py-20 lg:py-32"
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
            My Work
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Project <span className="gradient-text">Showcase</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed"
          >
            Explore my portfolio of innovative projects spanning AI, robotics,
            web development, and automation. Each project represents a unique
            challenge solved with cutting-edge technology and creative
            problem-solving.
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
            <Filter className="mr-2 inline h-4 w-4" />
            All Projects
          </motion.button>

          {categories.map((category, index) => (
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
              <Tag className="mr-2 inline h-4 w-4" />
              {categoryLabels[category]}
            </motion.button>
          ))}
        </motion.div>

        {/* 3D Carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 1.2 }}
          className="relative"
        >
          <div
            ref={carouselRef}
            className="perspective-1000 relative h-[500px] w-full overflow-hidden lg:h-[600px]"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Carousel Track */}
            <div className="relative flex h-full w-full items-center justify-center">
              <AnimatePresence mode="popLayout">
                {getVisibleProjects().map(({ project, offset, index }) => (
                  <motion.div
                    key={`${project.id}-${selectedCategory}`}
                    initial={{ opacity: 0, scale: 0.5, rotateY: offset * 45 }}
                    animate={{
                      opacity: offset === 0 ? 1 : 0.7,
                      scale: offset === 0 ? 1 : 0.8,
                      rotateY: offset * 15,
                      x: offset * 280,
                      z: offset === 0 ? 0 : -100,
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="absolute w-72 cursor-pointer lg:w-80"
                    onClick={() => goToProject(index)}
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <ProjectCard
                      project={project}
                      isActive={offset === 0}
                      isVisible={Math.abs(offset) <= 2}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="absolute inset-y-0 left-4 flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={prevProject}
                className="h-12 w-12 rounded-full border-2 bg-white/80 shadow-lg backdrop-blur-sm transition-transform hover:scale-110 dark:bg-black/80"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>

            <div className="absolute inset-y-0 right-4 flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={nextProject}
                className="h-12 w-12 rounded-full border-2 bg-white/80 shadow-lg backdrop-blur-sm transition-transform hover:scale-110 dark:bg-black/80"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="mt-8 flex justify-center space-x-2">
            {displayProjects.map((_, index) => (
              <button
                key={index}
                onClick={() => goToProject(index)}
                className={`h-3 w-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'scale-125 bg-blue-600'
                    : 'bg-border hover:bg-blue-300 dark:hover:bg-blue-700'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Project Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 2 }}
          className="mt-16 grid grid-cols-2 gap-6 lg:mt-24 lg:grid-cols-4"
        >
          {[
            { label: 'Total Projects', value: projects.length.toString() },
            {
              label: 'Featured Projects',
              value: projects.filter((p) => p.featured).length.toString(),
            },
            { label: 'Technologies Used', value: '20+' },
            {
              label: 'Live Deployments',
              value: projects.filter((p) => p.liveUrl).length.toString(),
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 2.2 + index * 0.1 }}
              className="border-border rounded-2xl border bg-white/50 p-6 text-center backdrop-blur-sm transition-transform hover:scale-105 dark:bg-white/5"
            >
              <div className="text-foreground mb-2 text-3xl font-bold">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Project Card Component
function ProjectCard({
  project,
  isActive,
  isVisible,
}: {
  project: Project;
  isActive: boolean;
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      whileHover={isActive ? { y: -5 } : {}}
      className={`relative h-[400px] overflow-hidden rounded-2xl border-2 shadow-2xl transition-all lg:h-[480px] ${
        isActive
          ? 'border-blue-500/50 shadow-blue-500/20'
          : 'border-border shadow-lg'
      }`}
      style={{
        background: `linear-gradient(135deg, ${
          categoryColors[project.category]
        }), linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.5))`,
      }}
    >
      {/* Project Image/Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-between p-6 text-white">
        {/* Header */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span
              className={`rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm`}
            >
              {categoryLabels[project.category]}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                project.status === 'completed'
                  ? 'bg-green-500/20 text-green-300'
                  : project.status === 'in-progress'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {project.status.replace('-', ' ')}
            </span>
          </div>

          <h3 className="mb-3 text-xl leading-tight font-bold lg:text-2xl">
            {project.title}
          </h3>

          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-white/90 lg:text-base">
            {project.description}
          </p>
        </div>

        {/* Technologies */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-white/15 px-2 py-1 text-xs font-medium backdrop-blur-sm"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="rounded-md bg-white/15 px-2 py-1 text-xs font-medium backdrop-blur-sm">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-white/80">
            <Calendar className="mr-2 h-4 w-4" />
            {project.completionDate}
          </div>

          <div className="flex space-x-2">
            {project.githubUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(project.githubUrl, '_blank');
                }}
              >
                <Github className="h-4 w-4" />
              </Button>
            )}

            {project.liveUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(project.liveUrl, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
