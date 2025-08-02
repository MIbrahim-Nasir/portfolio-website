'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { MapPin, Calendar, Users, Trophy, Building } from 'lucide-react';
import { experiences, domains } from '@/data/portfolio-data';

export default function ExperienceSection() {
  const [activeExperience, setActiveExperience] = useState<string>(
    experiences[0]?.id || ''
  );
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start end', 'end start'],
  });

  const timelineProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const activeExp = experiences.find((exp) => exp.id === activeExperience);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const viewportCenter = window.innerHeight / 2;

      let closestExperience = experiences[0];
      let minDistance = Infinity;

      experiences.forEach((experience) => {
        const expElement = document.getElementById(`exp-${experience.id}`);
        if (expElement) {
          const expRect = expElement.getBoundingClientRect();
          const distance = Math.abs(
            expRect.top + expRect.height / 2 - viewportCenter
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestExperience = experience;
          }
        }
      });

      setActiveExperience(closestExperience.id);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="experience"
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
            Professional Journey
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Experience & <span className="gradient-text">Expertise</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed"
          >
            From junior developer to leading complex projects across multiple
            domains. Explore my professional evolution and the diverse expertise
            I&apos;ve gained along the way.
          </motion.p>
        </motion.div>

        {/* Main Experience Timeline */}
        <div className="mb-20 grid gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Timeline Column */}
          <div className="lg:col-span-2">
            <div className="relative" ref={timelineRef}>
              {/* Progress Line */}
              <div className="bg-border dark:bg-border absolute top-0 left-8 h-full w-1">
                <motion.div
                  className="w-full origin-top bg-gradient-to-b from-blue-500 to-purple-500"
                  style={{
                    height: `${timelineProgress}%`,
                    maxHeight: '100%',
                  }}
                />
              </div>

              {/* Experience Cards */}
              <div className="space-y-8">
                {experiences.map((experience, index) => {
                  const isActive = activeExperience === experience.id;

                  return (
                    <motion.div
                      key={experience.id}
                      id={`exp-${experience.id}`}
                      initial={{ opacity: 0, x: -50 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.8, delay: index * 0.2 }}
                      className="relative pl-20"
                    >
                      {/* Timeline Node */}
                      <div className="absolute top-6 left-6 z-10">
                        <motion.div
                          animate={{
                            scale: isActive ? 1.2 : 1,
                            rotate: isActive ? 360 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                          className={`h-8 w-8 rounded-full bg-gradient-to-br ${
                            experience.current
                              ? 'from-green-500 to-emerald-500'
                              : 'from-blue-500 to-purple-500'
                          } border-background flex items-center justify-center border-4 shadow-lg`}
                        >
                          <Building className="h-4 w-4 text-white" />
                        </motion.div>
                      </div>

                      {/* Experience Card */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`rounded-2xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-md transition-all hover:shadow-xl lg:p-8 dark:border-white/10 dark:bg-white/5 ${
                          isActive
                            ? 'bg-blue-50/50 ring-2 ring-blue-500/50 dark:bg-blue-950/20'
                            : ''
                        }`}
                      >
                        {/* Header */}
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-foreground mb-2 text-xl font-bold lg:text-2xl">
                              {experience.title}
                            </h3>
                            <p className="mb-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                              {experience.company}
                            </p>
                          </div>

                          {experience.current && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
                              Current
                            </span>
                          )}
                        </div>

                        {/* Meta Info */}
                        <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {experience.startDate} -{' '}
                              {experience.endDate || 'Present'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{experience.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{experience.type}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {experience.description}
                        </p>

                        {/* Key Achievements */}
                        {experience.achievements &&
                          experience.achievements.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-foreground mb-2 flex items-center gap-2 font-semibold">
                                <Trophy className="h-4 w-4" />
                                Key Achievements
                              </h4>
                              <ul className="space-y-1">
                                {experience.achievements.map(
                                  (achievement, idx) => (
                                    <li
                                      key={idx}
                                      className="text-muted-foreground flex items-start gap-2 text-sm"
                                    >
                                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                                      {achievement}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {/* Technologies */}
                        <div className="flex flex-wrap gap-2">
                          {experience.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Experience Details */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="sticky top-8"
            >
              {activeExp && (
                <div className="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-purple-50 p-6 lg:p-8 dark:border-blue-800/50 dark:from-blue-950/20 dark:to-purple-950/20">
                  <h3 className="text-foreground mb-4 text-xl font-bold">
                    Current Focus: {activeExp.title}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-foreground mb-2 font-semibold">
                        Duration
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {activeExp.startDate} - {activeExp.endDate || 'Present'}
                        {activeExp.current && ' (Ongoing)'}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-foreground mb-2 font-semibold">
                        Company
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {activeExp.company}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-foreground mb-2 font-semibold">
                        Impact
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {activeExp.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Domain Expertise */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-20 lg:mt-32"
        >
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-2xl font-bold lg:text-3xl">
              Domain <span className="gradient-text">Expertise</span>
            </h3>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Specialized knowledge across multiple engineering domains, built
              through hands-on experience and continuous learning.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {domains.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
                onMouseEnter={() => setHoveredDomain(domain.id)}
                onMouseLeave={() => setHoveredDomain(null)}
                className="group relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="h-64 cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-md transition-all hover:shadow-xl dark:border-white/10 dark:bg-white/5"
                  style={{
                    background:
                      hoveredDomain === domain.id
                        ? `linear-gradient(135deg, ${domain.color}20, ${domain.color}10)`
                        : undefined,
                  }}
                >
                  {/* Domain Icon */}
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold text-white"
                    style={{ backgroundColor: domain.color }}
                  >
                    {domain.name
                      .split(' ')
                      .map((word) => word[0])
                      .join('')}
                  </div>

                  {/* Domain Info */}
                  <h4 className="text-foreground mb-2 text-lg font-bold">
                    {domain.name}
                  </h4>

                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    Specialized expertise in {domain.name.toLowerCase()} with
                    hands-on project experience.
                  </p>

                  {/* Skills Count */}
                  <div className="absolute right-6 bottom-6 left-6">
                    <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
                      <span>Skills</span>
                      <span>{domain.skills.length} technologies</span>
                    </div>
                    <div className="bg-border h-2 w-full rounded-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={
                          isInView
                            ? {
                                width: `${Math.min(domain.skills.length * 15, 100)}%`,
                              }
                            : {}
                        }
                        transition={{ duration: 1, delay: 1.6 + index * 0.1 }}
                        className="h-2 rounded-full"
                        style={{ backgroundColor: domain.color }}
                      />
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredDomain === domain.id ? 1 : 0 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-black/10 dark:to-white/5"
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Career Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-20 grid grid-cols-2 gap-6 lg:mt-32 lg:grid-cols-4"
        >
          {[
            { label: 'Years Experience', value: '3+' },
            { label: 'Companies Worked', value: experiences.length.toString() },
            { label: 'Domains Mastered', value: domains.length.toString() },
            { label: 'Team Projects Led', value: '8+' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 2 + index * 0.1 }}
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
