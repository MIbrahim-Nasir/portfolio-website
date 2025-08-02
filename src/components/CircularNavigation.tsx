'use client';

import { useState, useEffect, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
  href: string;
  abbreviation: string;
  color: string;
}

const navItems: NavItem[] = [
  {
    id: 'hero',
    label: 'Introduction',
    href: '#hero',
    abbreviation: 'IN',
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 'about',
    label: 'Life Events',
    href: '#about',
    abbreviation: 'LE',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'skills',
    label: 'Backend & AI',
    href: '#skills',
    abbreviation: 'BA',
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 'projects',
    label: 'Automation',
    href: '#projects',
    abbreviation: 'AU',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'experience',
    label: 'Arduino & Robotics',
    href: '#experience',
    abbreviation: 'AR',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'contact',
    label: 'Robotics',
    href: '#contact',
    abbreviation: 'RO',
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'skills',
    label: 'Web Engineering',
    href: '#skills',
    abbreviation: 'WE',
    color: 'from-orange-600 to-red-600',
  },
];

export default function CircularNavigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Transform values for the scroll animation
  const circleScale = useTransform(scrollY, [0, 300], [1, 0.6]);
  const circleY = useTransform(scrollY, [0, 300], [0, -100]);
  const semiCircleOpacity = useTransform(scrollY, [250, 350], [0, 1]);
  const fullCircleOpacity = useTransform(scrollY, [250, 350], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const getCirclePosition = (
    index: number,
    total: number,
    radius: number = 140
  ) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // Start from top
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const getSemiCirclePosition = (
    index: number,
    total: number,
    radius: number = 80
  ) => {
    const angle = (index * Math.PI) / (total - 1) - Math.PI; // Semi-circle from left to right
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.5, // Flatten the curve
    };
  };

  return (
    <>
      {/* Full Circle Navigation - Initial State */}
      <motion.div
        ref={containerRef}
        style={{
          scale: circleScale,
          y: circleY,
          opacity: fullCircleOpacity,
        }}
        className="pointer-events-none fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 transform"
      >
        <div className="relative h-80 w-80">
          {/* Main Circle with Glassmorphic Effect */}
          <div className="absolute inset-0 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl backdrop-blur-2xl" />

          {/* Liquid Glassmorphic Overlay */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-cyan-500/20 backdrop-blur-xl" />

          {/* Navigation Circles */}
          {navItems.map((item, index) => {
            const position = getCirclePosition(index, navItems.length);
            const isHovered = hoveredItem === item.id;

            return (
              <motion.div
                key={item.id}
                className="pointer-events-auto absolute"
                style={{
                  left: `calc(50% + ${position.x}px)`,
                  top: `calc(50% + ${position.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                whileHover={{ scale: 1.2, z: 10 }}
                onHoverStart={() => setHoveredItem(item.id)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                {/* Circle Button */}
                <motion.button
                  onClick={() => scrollToSection(item.href)}
                  className={`relative h-16 w-16 rounded-full bg-gradient-to-br ${item.color} border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Glassmorphic Inner Layer */}
                  <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />

                  {/* Abbreviation Text */}
                  <span className="relative z-10 text-sm font-bold text-white">
                    {item.abbreviation}
                  </span>

                  {/* Magnetic Attachment Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/10"
                    animate={
                      isHovered
                        ? { scale: 1.1, opacity: 0.8 }
                        : { scale: 1, opacity: 0 }
                    }
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>

                {/* Hover Label */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -80, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className="absolute left-1/2 -translate-x-1/2 transform whitespace-nowrap"
                    >
                      <div className="rounded-lg border border-white/20 bg-black/80 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm">
                        {item.label}
                        <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-4 border-r-4 border-l-4 border-transparent border-t-black/80" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Center Logo/Indicator */}
          <div className="absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl">
            <div className="h-3 w-3 animate-pulse rounded-full bg-white/60" />
          </div>
        </div>
      </motion.div>

      {/* Semi-Circle Navigation - Scrolled State */}
      <motion.div
        style={{ opacity: semiCircleOpacity }}
        className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-500 ${
          isScrolled ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="relative h-32 w-64 overflow-visible">
          {/* Semi-Circle Base with Glassmorphic Effect */}
          <div className="absolute inset-0 rounded-t-full border border-b-0 border-white/20 bg-gradient-to-br from-white/10 to-white/5 shadow-xl backdrop-blur-2xl" />

          {/* Liquid Glassmorphic Overlay */}
          <div className="absolute inset-1 rounded-t-full border-b-0 bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-cyan-500/20 backdrop-blur-xl" />

          {/* Semi-Circle Navigation Buttons */}
          {navItems.slice(0, 6).map((item, index) => {
            const position = getSemiCirclePosition(index, 6);
            const isHovered = hoveredItem === item.id;

            return (
              <motion.div
                key={item.id}
                className="pointer-events-auto absolute"
                style={{
                  left: `calc(50% + ${position.x}px)`,
                  top: `calc(100% + ${position.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                whileHover={{ scale: 1.1, y: -5 }}
                onHoverStart={() => setHoveredItem(item.id)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                {/* Magnetic Connection Line */}
                <motion.div
                  className="absolute bottom-6 left-1/2 w-0.5 -translate-x-1/2 transform bg-gradient-to-t from-white/40 to-transparent"
                  animate={
                    isHovered
                      ? { height: 20, opacity: 1 }
                      : { height: 8, opacity: 0.3 }
                  }
                  transition={{ duration: 0.2 }}
                />

                {/* Circle Button */}
                <motion.button
                  onClick={() => scrollToSection(item.href)}
                  className={`relative h-12 w-12 rounded-full bg-gradient-to-br ${item.color} border border-white/30 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Glassmorphic Inner Layer */}
                  <div className="absolute inset-0.5 rounded-full bg-white/20 backdrop-blur-sm" />

                  {/* Abbreviation Text */}
                  <span className="relative z-10 text-xs font-bold text-white">
                    {item.abbreviation}
                  </span>

                  {/* Magnetic Glow Effect */}
                  <motion.div
                    className="absolute -inset-1 rounded-full bg-white/20 blur-sm"
                    animate={
                      isHovered
                        ? { scale: 1.2, opacity: 0.6 }
                        : { scale: 1, opacity: 0 }
                    }
                    transition={{ duration: 0.2 }}
                  />
                </motion.button>

                {/* Hover Label for Semi-Circle */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -70, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className="absolute left-1/2 -translate-x-1/2 transform whitespace-nowrap"
                    >
                      <div className="rounded-md border border-white/20 bg-black/80 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {item.label}
                        <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-3 border-r-3 border-l-3 border-transparent border-t-black/80" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
