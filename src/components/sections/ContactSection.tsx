'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Mail,
  Send,
  Github,
  Linkedin,
  Download,
  MessageCircle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { personalInfo } from '@/data/portfolio-data';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactSection() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactForm> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ContactForm]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Using Next.js API route for server-side email sending
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      setSubmitStatus('error');
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to send message. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSubmitStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: personalInfo.email,
      href: `mailto:${personalInfo.email}`,
      description: 'Drop me a line anytime',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: personalInfo.socialLinks.whatsapp || '+91 8466820765',
      href: `https://wa.me/${personalInfo.socialLinks.whatsapp?.replace(/\D/g, '') || '918466820765'}`,
      description: 'Message me directly',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Calendar,
      label: 'Schedule',
      value: 'Book a Meeting',
      href: '#',
      description: 'Schedule a convenient time',
      color: 'from-purple-500 to-violet-500',
    },
  ];

  const socialLinks = [
    {
      icon: Github,
      label: 'GitHub',
      href: personalInfo.socialLinks.github || '#',
      description: 'Check out my code',
      color: 'bg-gray-800 hover:bg-gray-700',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      href: personalInfo.socialLinks.linkedin || '#',
      description: "Let's connect professionally",
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: `https://wa.me/${personalInfo.socialLinks.whatsapp?.replace(/\D/g, '') || '918466820765'}`,
      description: 'Message me directly',
      color: 'bg-green-500 hover:bg-green-600',
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
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
            Get In Touch
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Let&apos;s Build Something{' '}
            <span className="gradient-text">Amazing</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed"
          >
            Ready to turn ideas into reality? I&apos;m always excited to discuss
            new projects, innovative solutions, and opportunities to create
            meaningful impact through technology.
          </motion.p>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Contact Methods */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <h3 className="text-foreground mb-8 text-2xl font-bold">
                Ways to Connect
              </h3>

              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <motion.a
                    key={method.label}
                    href={method.href}
                    target={
                      method.href.startsWith('http') ? '_blank' : undefined
                    }
                    rel={
                      method.href.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="border-border group flex items-center gap-4 rounded-2xl border bg-white/50 p-4 backdrop-blur-sm transition-all hover:shadow-lg dark:bg-white/5"
                  >
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}
                    >
                      <method.icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-foreground font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {method.label}
                      </h4>
                      <p className="text-muted-foreground mb-1 text-sm">
                        {method.description}
                      </p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {method.value}
                      </p>
                    </div>

                    <ExternalLink className="text-muted-foreground h-4 w-4 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </motion.a>
                ))}
              </div>

              {/* Resume Download */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 1.6 }}
                className="mt-8"
              >
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/resume.pdf';
                    link.download = 'Ibrahim_Nasir_Resume.pdf';
                    link.click();
                  }}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Resume
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-md lg:p-10 dark:border-white/10 dark:bg-white/5"
            >
              <h3 className="text-foreground mb-2 text-2xl font-bold">
                Send a Message
              </h3>
              <p className="text-muted-foreground mb-8">
                Have a project in mind? Let&apos;s discuss how we can bring your
                ideas to life.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="text-foreground mb-2 block text-sm font-medium"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`border-border bg-background/50 dark:bg-background/50 text-foreground placeholder-muted-foreground w-full rounded-xl border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none ${
                        errors.name
                          ? 'border-red-500 focus:ring-red-500'
                          : 'focus:ring-blue-500'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="text-foreground mb-2 block text-sm font-medium"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`border-border bg-background/50 dark:bg-background/50 text-foreground placeholder-muted-foreground w-full rounded-xl border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'focus:ring-blue-500'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className={`border-border bg-background/50 dark:bg-background/50 text-foreground placeholder-muted-foreground w-full rounded-xl border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none ${
                      errors.subject
                        ? 'border-red-500 focus:ring-red-500'
                        : 'focus:ring-blue-500'
                    }`}
                    placeholder="What's this about?"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className={`border-border bg-background/50 dark:bg-background/50 text-foreground placeholder-muted-foreground w-full resize-none rounded-xl border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none ${
                      errors.message
                        ? 'border-red-500 focus:ring-red-500'
                        : 'focus:ring-blue-500'
                    }`}
                    placeholder="Tell me about your project, ideas, or how we can collaborate..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.message}
                    </p>
                  )}
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Form Status */}
                {submitStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 text-center ${
                      submitStatus === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                    }`}
                  >
                    {submitStatus === 'success'
                      ? "Message sent successfully! I'll get back to you soon."
                      : errorMessage ||
                        'Something went wrong. Please try again or contact me directly.'}
                  </motion.div>
                )}
              </form>
            </motion.div>
          </div>
        </div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-16 lg:mt-24"
        >
          <div className="mb-8 text-center">
            <h3 className="text-foreground mb-2 text-xl font-bold">
              Connect on Social
            </h3>
            <p className="text-muted-foreground">
              Follow my journey and latest updates
            </p>
          </div>

          <div className="flex justify-center gap-6">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 1.6 + index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`h-14 w-14 rounded-2xl ${social.color} group flex items-center justify-center text-white shadow-lg transition-all hover:shadow-xl`}
                title={social.description}
              >
                <social.icon className="h-6 w-6 transition-transform group-hover:scale-110" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-20 text-center lg:mt-32"
        >
          <div className="mx-auto max-w-3xl rounded-3xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-purple-50 p-8 lg:p-12 dark:border-blue-800/50 dark:from-blue-950/20 dark:to-purple-950/20">
            <h3 className="gradient-text mb-4 text-2xl font-bold lg:text-3xl">
              Ready to Start Your Project?
            </h3>
            <p className="text-muted-foreground mb-6 text-lg">
              Whether you need a full-stack application, AI solution, or robotic
              system, I&apos;m here to help transform your vision into reality.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-blue-600 px-8 text-white hover:bg-blue-700"
                onClick={() => {
                  document.getElementById('name')?.focus();
                }}
              >
                <Mail className="mr-2 h-5 w-5" />
                Start a Conversation
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8"
                onClick={() => {
                  window.open(
                    `mailto:${personalInfo.email}?subject=Quick Question`,
                    '_blank'
                  );
                }}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Quick Question
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
