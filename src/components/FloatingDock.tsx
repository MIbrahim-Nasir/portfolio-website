'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Database, Zap, Settings, Globe } from 'lucide-react';
import { domains } from '@/data/portfolio-data';

// Navigation items matching the hero section
const dockItems = [
  {
    id: 'hero',
    label: 'Introduction',
    href: '#hero',
    icon: Home,
    domain: 'ai-ml',
  },
  {
    id: 'about',
    label: 'Life Events',
    href: '#about',
    icon: Calendar,
    domain: 'leadership',
  },
  {
    id: 'skills',
    label: 'Backend & AI',
    href: '#skills',
    icon: Database,
    domain: 'backend',
  },
  {
    id: 'projects',
    label: 'Automation',
    href: '#projects',
    icon: Zap,
    domain: 'automation',
  },
  {
    id: 'experience',
    label: 'Robotics',
    href: '#experience',
    icon: Settings,
    domain: 'robotics',
  },
  {
    id: 'contact',
    label: 'Web Engineering',
    href: '#contact',
    icon: Globe,
    domain: 'web-development',
  },
];

export default function FloatingDock() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show dock when user scrolls past the hero section
      const heroSection = document.querySelector('#hero') as HTMLElement;
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        setIsVisible(scrollPosition > heroBottom);
      }
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
    setIsExpanded(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 transform"
        >
          {/* Main Dock Container */}
          <motion.div
            className="relative"
            onHoverStart={() => setIsExpanded(true)}
            onHoverEnd={() => {
              setIsExpanded(false);
              setHoveredItem(null);
            }}
          >
            {/* Central Hub - Collapsed State */}
            <motion.div
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-blue-600/90 to-purple-600/90 shadow-2xl backdrop-blur-xl"
              animate={{
                scale: isExpanded ? 1.1 : 1,
                boxShadow: isExpanded
                  ? '0 20px 40px rgba(59, 130, 246, 0.4)'
                  : '0 10px 30px rgba(59, 130, 246, 0.3)',
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Central navigation icon */}
              <motion.div
                className="text-lg text-white"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                ⚡
              </motion.div>
            </motion.div>

            {/* Expanded Navigation Items */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {dockItems.map((item, index) => {
                    const domain = domains.find((d) => d.id === item.domain);
                    if (!domain) return null;

                    // Create perfect circular arrangement around the center
                    const angle = (index * 360) / dockItems.length - 90; // Start from top and distribute evenly
                    const radius = 85;
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    const isHovered = hoveredItem === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        className="absolute"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                        }}
                        initial={{
                          scale: 0,
                          opacity: 0,
                        }}
                        animate={{
                          scale: 1,
                          opacity: 1,
                        }}
                        exit={{
                          scale: 0,
                          opacity: 0,
                        }}
                        transition={{
                          delay: index * 0.05,
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        <motion.button
                          onClick={() => scrollToSection(item.href)}
                          className="group relative flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full border border-white/30 text-white shadow-xl backdrop-blur-xl"
                          style={{
                            background: `linear-gradient(135deg, ${domain.color}80, ${domain.color}60)`,
                          }}
                          whileHover={{
                            scale: 1.3,
                            boxShadow: `0 15px 35px ${domain.color}50`,
                          }}
                          whileTap={{ scale: 0.9 }}
                          onHoverStart={() => setHoveredItem(item.id)}
                          onHoverEnd={() => setHoveredItem(null)}
                        >
                          <item.icon className="h-5 w-5" />

                          {/* Expanding ring on hover */}
                          <motion.div
                            className="absolute inset-0 rounded-full border-2"
                            style={{ borderColor: domain.color + '80' }}
                            initial={{ scale: 1, opacity: 0 }}
                            whileHover={{ scale: 1.5, opacity: [0, 1, 0] }}
                            transition={{ duration: 0.8 }}
                          />

                          {/* Connection line to center */}
                          <motion.div
                            className="absolute top-1/2 left-1/2 h-px origin-left -translate-y-1/2 transform bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            style={{
                              width: `${radius}px`,
                              transform: `translateY(-50%) rotate(${angle + 180}deg)`,
                              transformOrigin: '0 50%',
                            }}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 0.7 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.6 }}
                          />

                          {/* Enhanced tooltip */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: -15, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                className="pointer-events-none absolute -top-16 left-1/2 z-50 -translate-x-1/2 transform"
                              >
                                <div
                                  className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium whitespace-nowrap text-white backdrop-blur-sm"
                                  style={{
                                    background: `linear-gradient(135deg, ${domain.color}95, ${domain.color}80)`,
                                  }}
                                >
                                  {item.label}
                                  <div
                                    className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform"
                                    style={{
                                      backgroundColor: domain.color + '95',
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtle glow effect */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20"
              animate={{
                scale: isExpanded ? 3 : 1.5,
                opacity: isExpanded ? 0.8 : 0.4,
              }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
