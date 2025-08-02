'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Calendar, MapPin, Award, Target, Heart, Brain } from 'lucide-react';
import { personalInfo } from '@/data/portfolio-data';

interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  organization: string;
  location: string;
  description: string;
  type: 'education' | 'experience' | 'achievement' | 'milestone';
  icon: typeof Calendar;
  color: string;
}

const timelineEvents: TimelineEvent[] = [
  {
    id: 'birth',
    year: '2003',
    title: 'Born in Dubai',
    organization: 'The Beginning',
    location: 'Dubai, UAE',
    description:
      'Started my journey in the beautiful city of Dubai, UAE, where my passion for technology first sparked.',
    type: 'milestone',
    icon: Heart,
    color: 'from-pink-500 to-red-500',
  },
  {
    id: 'school-start',
    year: '2007',
    title: 'Started School',
    organization: 'New Indian Model School (NIMS)',
    location: 'Dubai, UAE',
    description:
      'Began my educational journey at NIMS Dubai, laying the foundation for academic excellence.',
    type: 'education',
    icon: Brain,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'tenth-grade',
    year: '2019',
    title: '10th Grade CBSE - 92%',
    organization: 'New Indian Model School (NIMS)',
    location: 'Dubai, UAE',
    description:
      'Graduated 10th grade with 92% in CBSE board, demonstrating strong academic foundation.',
    type: 'education',
    icon: Award,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'intermediate',
    year: '2019-2021',
    title: 'Intermediate College - 94%',
    organization: 'Sri Chaitanya Junior College',
    location: 'India',
    description:
      'Completed 11th and 12th grades with 94% in State Board Telangana, excelling in science subjects.',
    type: 'education',
    icon: Target,
    color: 'from-purple-500 to-violet-500',
  },
  {
    id: 'engineering-start',
    year: '2021',
    title: 'Started B.E Computer Science',
    organization: 'Muffakham Jah College Of Engineering',
    location: 'Hyderabad, India',
    description:
      'Embarked on my Computer Science Engineering degree at Osmania University, discovering passion for technology.',
    type: 'education',
    icon: Brain,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'tsig-join',
    year: '2022',
    title: 'Joined TSIG as Core Member',
    organization: 'TSIG MJCET',
    location: 'Hyderabad, India',
    description:
      'Started as Mechatronics Core member in the multidisciplinary engineering club, beginning leadership journey.',
    type: 'experience',
    icon: Target,
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'deltax-intern',
    year: '2025',
    title: 'Associate Product Engineer',
    organization: 'DeltaX',
    location: 'Hyderabad, India',
    description:
      'Interned as Associate Product Engineer working on .NET backend systems with database integration.',
    type: 'experience',
    icon: Target,
    color: 'from-teal-500 to-green-500',
  },
  {
    id: 'graduation',
    year: '2024',
    title: 'B.E Graduation with Distinction',
    organization: 'Muffakham Jah College Of Engineering',
    location: 'Hyderabad, India',
    description:
      'Graduated with distinction GPA as Vice Chair of TSIG, completing a remarkable engineering journey.',
    type: 'achievement',
    icon: Award,
    color: 'from-emerald-500 to-teal-500',
  },
];

export default function AboutSection() {
  const [activeEvent, setActiveEvent] = useState<string>('present');
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start end', 'end start'],
  });

  const timelineProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const viewportCenter = window.innerHeight / 2;

      let closestEvent = timelineEvents[0];
      let minDistance = Infinity;

      timelineEvents.forEach((event) => {
        const eventElement = document.getElementById(`event-${event.id}`);
        if (eventElement) {
          const eventRect = eventElement.getBoundingClientRect();
          const distance = Math.abs(
            eventRect.top + eventRect.height / 2 - viewportCenter
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestEvent = event;
          }
        }
      });

      setActiveEvent(closestEvent.id);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
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
            My Journey
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            The <span className="gradient-text">DNA of Innovation</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed"
          >
            Every experience has shaped who I am today. From my early
            fascination with technology to leading complex projects, each step
            has been a building block in my journey of continuous learning and
            innovation.
          </motion.p>
        </motion.div>

        {/* Personal Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-16 grid grid-cols-2 gap-6 lg:mb-24 lg:grid-cols-4"
        >
          {[
            { label: 'Years Experience', value: '3+', icon: Target },
            { label: 'Projects Completed', value: '12+', icon: Award },
            { label: 'Technologies Mastered', value: '20+', icon: Brain },
            { label: 'Domains Explored', value: '4', icon: Heart },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
              className="rounded-2xl border border-white/20 bg-white/50 p-6 text-center backdrop-blur-sm transition-transform hover:scale-105 dark:border-white/10 dark:bg-white/5"
            >
              <stat.icon className="mx-auto mb-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="text-foreground mb-2 text-3xl font-bold">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* DNA Timeline */}
        <div className="relative" ref={timelineRef}>
          {/* Progress Line */}
          <div className="bg-border dark:bg-border absolute left-1/2 h-full w-1 -translate-x-1/2 transform">
            <motion.div
              className="w-full origin-top bg-gradient-to-b from-blue-500 to-purple-500"
              style={{
                height: `${timelineProgress}%`,
                maxHeight: '100%',
              }}
            />
          </div>

          {/* Timeline Events */}
          <div className="space-y-12 lg:space-y-16">
            {timelineEvents.map((event, index) => {
              const isLeft = index % 2 === 0;
              const isActive = activeEvent === event.id;

              return (
                <motion.div
                  key={event.id}
                  id={`event-${event.id}`}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`relative flex items-center ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-1/2 z-10 -translate-x-1/2 transform">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.2 : 1,
                        rotate: isActive ? 360 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`h-12 w-12 rounded-full bg-gradient-to-br ${event.color} border-background flex items-center justify-center border-4 shadow-lg`}
                    >
                      <event.icon className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>

                  {/* Event Content */}
                  <div
                    className={`w-full lg:w-5/12 ${isLeft ? 'lg:pr-16' : 'lg:pl-16'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg backdrop-blur-md transition-all hover:shadow-xl sm:p-6 lg:p-8 dark:border-white/10 dark:bg-white/5 ${
                        isActive
                          ? 'bg-blue-50/50 ring-2 ring-blue-500/50 dark:bg-blue-950/20'
                          : ''
                      }`}
                    >
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                          {event.year}
                        </span>
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            event.type === 'education'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                              : event.type === 'experience'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400'
                                : event.type === 'achievement'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                                  : 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400'
                          }`}
                        >
                          {event.type}
                        </span>
                      </div>

                      <h3 className="text-foreground mb-2 text-lg font-bold sm:text-xl lg:text-2xl">
                        {event.title}
                      </h3>

                      <div className="text-muted-foreground mb-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-4">
                        <span className="font-medium">
                          {event.organization}
                        </span>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                        {event.description}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Philosophy Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-20 text-center lg:mt-32"
        >
          <div className="mx-auto max-w-4xl rounded-3xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-purple-50 p-8 lg:p-12 dark:border-blue-800/50 dark:from-blue-950/20 dark:to-purple-950/20">
            <h3 className="gradient-text mb-6 text-2xl font-bold lg:text-3xl">
              My Philosophy
            </h3>
            <p className="text-muted-foreground mb-6 text-lg leading-relaxed lg:text-xl">
              &ldquo;{personalInfo.philosophy}&rdquo;
            </p>
            <p className="text-muted-foreground">
              This philosophy drives every project I undertake, every problem I
              solve, and every innovation I pursue. It&apos;s not just about
              writing code or building systems—it&apos;s about creating
              meaningful impact through technology.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
