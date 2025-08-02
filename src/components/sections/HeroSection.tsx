'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Download, Mail, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { personalInfo, domains } from '@/data/portfolio-data';

export default function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToNext = () => {
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-accent/10 relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br"
    >
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-blue-500/20 dark:bg-blue-400/30"
            initial={{
              x:
                typeof window !== 'undefined'
                  ? Math.random() * window.innerWidth
                  : Math.random() * 1200,
              y:
                typeof window !== 'undefined'
                  ? Math.random() * window.innerHeight
                  : Math.random() * 800,
              scale: 0,
            }}
            animate={{
              y: [null, -100, -200],
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Mouse-following gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px at ${mousePosition.x}% ${mousePosition.y}%, rgba(37, 99, 235, 0.15), transparent 80%)`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
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
              className="mb-6 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              <span className="gradient-text">{personalInfo.name}</span>
            </motion.h1>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-muted-foreground mb-6 text-xl font-medium sm:text-2xl lg:text-3xl"
            >
              {personalInfo.title}
            </motion.h2>

            {/* Key Traits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="mb-8 flex flex-wrap justify-center gap-3 lg:justify-start"
            >
              {['Adaptable', 'Intuitive', 'Passionate'].map((trait, index) => (
                <motion.span
                  key={trait}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                  className="rounded-full border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
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
              className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg lg:mx-0"
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
              className="mb-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Button
                size="lg"
                className="animate-pulse-glow bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700"
                onClick={() => scrollToNext()}
              >
                <Mail className="mr-2 h-5 w-5" />
                Let&apos;s Connect
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 px-8 py-3 text-lg font-medium"
              >
                <Download className="mr-2 h-5 w-5" />
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
            className="flex items-center justify-center"
          >
            <div className="relative h-80 w-80 lg:h-96 lg:w-96">
              {/* 3D Sphere Placeholder */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="relative h-full w-full"
              >
                {/* Main sphere */}
                <div className="absolute inset-8 animate-pulse rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-orange-500 opacity-20 dark:opacity-30" />

                {/* Domain icons around the sphere */}
                {domains.slice(0, 6).map((domain, index) => {
                  const angle = (index * 360) / 6;
                  const radius = 140;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;

                  return (
                    <motion.div
                      key={domain.id}
                      className="glass absolute flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/20 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-transform hover:scale-110"
                      style={{
                        left: `calc(50% + ${x}px - 24px)`,
                        top: `calc(50% + ${y}px - 24px)`,
                        backgroundColor: domain.color + '80',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 2 + index * 0.1 }}
                      whileHover={{ scale: 1.2 }}
                    >
                      {domain.name.split(' ')[0].slice(0, 2).toUpperCase()}
                    </motion.div>
                  );
                })}

                {/* Center sphere */}
                <motion.div
                  className="absolute inset-1/2 -mt-8 -ml-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-lg font-bold text-white shadow-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  IN
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollToNext}
            className="animate-bounce hover:text-blue-600"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
