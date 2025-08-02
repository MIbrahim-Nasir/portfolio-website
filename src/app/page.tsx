'use client';

import { useEffect } from 'react';
import HeroSection from '@/components/sections/HeroSection';
import WhyHireMeSection from '@/components/sections/WhyHireMeSection';
import AboutSection from '@/components/sections/AboutSection';
import SkillsSection from '@/components/sections/SkillsSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import ExperienceSection from '@/components/sections/ExperienceSection';
import ContactSection from '@/components/sections/ContactSection';
import Navigation from '@/components/Navigation';
import FloatingDock from '@/components/FloatingDock';

export default function Home() {
  useEffect(() => {
    // Add any initialization logic here
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Traditional Navigation */}
      <Navigation />

      {/* Floating Dock Navigation */}
      <FloatingDock />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <HeroSection />

        {/* Why Hire Me Section */}
        <WhyHireMeSection />

        {/* About Section */}
        <AboutSection />

        {/* Skills Section */}
        <SkillsSection />

        {/* Projects Section */}
        <ProjectsSection />

        {/* Experience Section */}
        <ExperienceSection />

        {/* Contact Section */}
        <ContactSection />
      </main>
    </div>
  );
}
