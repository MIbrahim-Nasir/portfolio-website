'use client';

import { useState, useEffect } from 'react';
import HeroSection from '@/components/sections/HeroSection';
import Navigation from '@/components/Navigation';
import { personalInfo } from '@/data/portfolio-data';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative">
        {/* Hero Section */}
        <HeroSection />

        {/* Other sections will be added here */}
        <section
          id="about"
          className="flex min-h-screen items-center justify-center"
        >
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold">About Section</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </section>

        <section
          id="skills"
          className="bg-muted/20 flex min-h-screen items-center justify-center"
        >
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold">Skills Section</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </section>

        <section
          id="projects"
          className="flex min-h-screen items-center justify-center"
        >
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold">Projects Section</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </section>

        <section
          id="experience"
          className="bg-muted/20 flex min-h-screen items-center justify-center"
        >
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold">Experience Section</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </section>

        <section
          id="contact"
          className="flex min-h-screen items-center justify-center"
        >
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold">Contact Section</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </section>
      </main>
    </div>
  );
}
