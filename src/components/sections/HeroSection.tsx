'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Mail,
  Github,
  Linkedin,
  Home,
  Calendar,
  Database,
  Zap,
  Settings,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { personalInfo, domains } from '@/data/portfolio-data';

// Navigation items mapping to the domains
const navItems = [
  {
    id: 'hero',
    label: 'Introduction',
    href: '#hero',
    abbreviation: 'IN',
    domain: 'ai-ml',
    icon: Home,
  },
  {
    id: 'about',
    label: 'Life Events',
    href: '#about',
    abbreviation: 'LE',
    domain: 'leadership',
    icon: Calendar,
  },
  {
    id: 'skills',
    label: 'Backend & AI',
    href: '#skills',
    abbreviation: 'BA',
    domain: 'backend',
    icon: Database,
  },
  {
    id: 'projects',
    label: 'Automation',
    href: '#projects',
    abbreviation: 'AU',
    domain: 'automation',
    icon: Zap,
  },
  {
    id: 'experience',
    label: 'Robotics',
    href: '#experience',
    abbreviation: 'RO',
    domain: 'robotics',
    icon: Settings,
  },
  {
    id: 'contact',
    label: 'Web Engineering',
    href: '#contact',
    abbreviation: 'WE',
    domain: 'web-development',
    icon: Globe,
  },
];

export default function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState(false);

  // Function to get responsive radius based on screen size
  const getResponsiveRadius = () => {
    if (!isClient) return 100; // Default for SSR
    const width = window.innerWidth;
    if (width < 640) return 70; // Mobile
    if (width < 768) return 85; // Small tablets
    if (width < 1024) return 100; // Tablets
    if (width < 1280) return 120; // Small desktop
    return 140; // Large desktop
  };

  useEffect(() => {
    setIsClient(true); // Mark as client-side

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Set initial window size
    handleResize();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scrollToNext = () => {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <section
      id="hero"
      className="from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-accent/10 relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br"
    >
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Mouse-following gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px at ${mousePosition.x}% ${mousePosition.y}%, rgba(37, 99, 235, 0.15), transparent 80%)`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            {/* Greeting */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-4 text-lg font-medium text-blue-600 sm:text-xl"
            >
              Hello, I&apos;m
            </motion.p>

            {/* Name */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-4 text-3xl leading-tight font-bold sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
            >
              <span className="gradient-text">{personalInfo.name}</span>
            </motion.h1>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-muted-foreground mb-4 text-lg font-medium sm:mb-6 sm:text-xl md:text-2xl lg:text-3xl"
            >
              {personalInfo.title}
            </motion.h2>

            {/* Key Traits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mb-6 flex flex-wrap justify-center gap-2 sm:mb-8 sm:gap-3 lg:justify-start"
            >
              {['Adaptable', 'Intuitive', 'Passionate'].map((trait, index) => (
                <motion.span
                  key={trait}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                  className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 sm:px-4 sm:py-2 sm:text-sm dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                >
                  {trait}
                </motion.span>
              ))}
            </motion.div>

            {/* Bio */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-muted-foreground mx-auto mb-6 max-w-2xl text-base leading-relaxed sm:mb-8 sm:text-lg lg:mx-0"
            >
              Recent Computer Science graduate with expertise in AI, Robotics,
              Full-Stack Development, and Technology Leadership. Passionate
              about solving complex problems and creating innovative solutions.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="mb-6 flex flex-col justify-center gap-3 sm:mb-8 sm:flex-row sm:gap-4 lg:justify-start"
            >
              <Button
                size="lg"
                className="animate-pulse-glow bg-blue-600 px-6 py-2.5 text-base font-medium text-white hover:bg-blue-700 sm:px-8 sm:py-3 sm:text-lg"
                onClick={() => scrollToSection('#contact')}
              >
                <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Let&apos;s Connect
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 px-6 py-2.5 text-base font-medium sm:px-8 sm:py-3 sm:text-lg"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/resume.pdf';
                  link.download = 'Ibrahim_Nasir_Resume.pdf';
                  link.click();
                }}
              >
                <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Download Resume
              </Button>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.8 }}
              className="flex justify-center gap-4 lg:justify-start"
            >
              {personalInfo.socialLinks.github && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                  asChild
                >
                  <a
                    href={personalInfo.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-6 w-6" />
                  </a>
                </Button>
              )}

              {personalInfo.socialLinks.linkedin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                  asChild
                >
                  <a
                    href={personalInfo.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-6 w-6" />
                  </a>
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* Right Column - 3D Sphere Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 flex items-center justify-center lg:mt-0"
          >
            <div className="relative h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64 lg:h-80 lg:w-80 xl:h-96 xl:w-96">
              {/* Modern Navigation Hub */}
              <motion.div
                className="relative flex h-full w-full items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                {/* Background gradient sphere */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-3xl"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                  }}
                />

                {/* Central Hub - Main Navigation Trigger */}
                <motion.div
                  className="group relative z-10 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Main navigation button */}
                  <motion.div
                    className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-gradient-to-br from-blue-600/80 to-purple-600/80 shadow-2xl backdrop-blur-xl sm:h-16 sm:w-16 md:h-18 md:w-18 lg:h-20 lg:w-20"
                    animate={{
                      boxShadow: [
                        '0 0 30px rgba(59, 130, 246, 0.3)',
                        '0 0 50px rgba(147, 51, 234, 0.4)',
                        '0 0 30px rgba(59, 130, 246, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    onHoverStart={() => setHoveredNav('hub')}
                    onHoverEnd={() => setHoveredNav(null)}
                  >
                    {/* Navigation icon */}
                    <motion.div
                      className="text-lg font-bold text-white sm:text-xl md:text-2xl"
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      ⚡
                    </motion.div>

                    {/* Hover ripple effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/20"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.5, opacity: [0, 0.5, 0] }}
                      transition={{ duration: 0.8 }}
                    />
                  </motion.div>

                  {/* Central hub tooltip */}
                  <AnimatePresence>
                    {hoveredNav === 'hub' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -15, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 transform rounded-lg border border-white/20 bg-black/90 px-4 py-2 text-sm whitespace-nowrap text-white backdrop-blur-sm"
                      >
                        Navigate Sections
                        <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-4 border-r-4 border-l-4 border-transparent border-t-black/90" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Speed Dial Navigation Items */}
                {isClient && (
                  <AnimatePresence>
                    {navItems.map((navItem, index) => {
                      const domain = domains.find(
                        (d) => d.id === navItem.domain
                      );
                      if (!domain) return null;

                      const angle = (index * 360) / navItems.length - 90; // Start from top
                      const radius = getResponsiveRadius();
                      const x = Math.cos((angle * Math.PI) / 180) * radius;
                      const y = Math.sin((angle * Math.PI) / 180) * radius;
                      const isHovered = hoveredNav === navItem.id;

                      return (
                        <motion.div
                          key={navItem.id}
                          className="absolute"
                          style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                          }}
                          initial={{
                            scale: 0,
                            opacity: 0,
                            x: -x * 0.3,
                            y: -y * 0.3,
                          }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                            x: 0,
                            y: 0,
                          }}
                          exit={{
                            scale: 0,
                            opacity: 0,
                            x: -x * 0.3,
                            y: -y * 0.3,
                          }}
                          transition={{
                            delay: 1 + index * 0.15,
                            type: 'spring',
                            stiffness: 250,
                            damping: 20,
                          }}
                        >
                          <motion.button
                            onClick={() => scrollToSection(navItem.href)}
                            className="group relative flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full border border-white/25 font-bold text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16"
                            style={{
                              background: `linear-gradient(135deg, ${domain.color}60, ${domain.color}40)`,
                            }}
                            whileHover={{
                              scale: 1.2,
                              boxShadow: `0 15px 40px ${domain.color}40`,
                            }}
                            whileTap={{ scale: 0.9 }}
                            onHoverStart={() => setHoveredNav(navItem.id)}
                            onHoverEnd={() => setHoveredNav(null)}
                          >
                            <navItem.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />

                            {/* Expanding ring on hover */}
                            <motion.div
                              className="absolute inset-0 rounded-full border-2"
                              style={{ borderColor: domain.color + '60' }}
                              initial={{ scale: 1, opacity: 0 }}
                              whileHover={{ scale: 1.4, opacity: [0, 1, 0] }}
                              transition={{ duration: 1 }}
                            />

                            {/* Connecting line to center */}
                            <motion.div
                              className="absolute top-1/2 left-1/2 h-px origin-left -translate-y-1/2 transform bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              style={{
                                width: `${radius}px`,
                                transform: `translateY(-50%) rotate(${angle + 180}deg)`,
                                transformOrigin: '0 50%',
                              }}
                              initial={{ scaleX: 0, opacity: 0 }}
                              animate={{ scaleX: 1, opacity: 0.6 }}
                              exit={{ scaleX: 0, opacity: 0 }}
                              transition={{
                                delay: 1 + index * 0.1,
                                duration: 1,
                              }}
                            />

                            {/* Enhanced hover label */}
                            <AnimatePresence>
                              {isHovered && (
                                <motion.div
                                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                                  animate={{ opacity: 1, y: -10, scale: 1 }}
                                  exit={{ opacity: 0, y: 15, scale: 0.8 }}
                                  className="absolute -top-20 left-1/2 z-50 -translate-x-1/2 transform"
                                >
                                  <div
                                    className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium whitespace-nowrap text-white backdrop-blur-sm"
                                    style={{
                                      background: `linear-gradient(135deg, ${domain.color}90, ${domain.color}70)`,
                                    }}
                                  >
                                    {navItem.label}
                                    <div
                                      className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-4 border-r-4 border-l-4 border-transparent"
                                      style={{
                                        borderTopColor: domain.color + '90',
                                      }}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Why Hire Me Button - Centered at Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
        >
          <Button
            size="lg"
            className="group animate-pulse-glow relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-bold text-white transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25"
            onClick={() => {
              const element = document.querySelector('#why-hire-me');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            <span className="relative z-10 flex items-center">
              🚀 Why Hire Me?
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500"
              initial={{ x: '-100%' }}
              whileHover={{ x: '0%' }}
              transition={{ duration: 0.3 }}
            />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
