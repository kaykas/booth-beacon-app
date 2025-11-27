'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, MapPin, MessageSquare, Send, Instagram, Twitter } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show success - in production, this would send to an API
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-secondary via-white to-secondary film-grain">
        {/* Hero */}
        <section className="py-16 px-4 text-center warm-glow">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-5xl md:text-6xl font-semibold text-neutral-900 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              Have a question, found a booth, or just want to say hello? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Email */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Email Us</h3>
                <p className="text-neutral-600 mb-4">
                  For general inquiries and support
                </p>
                <a
                  href="mailto:hello@boothbeacon.org"
                  className="text-primary hover:underline font-medium"
                >
                  hello@boothbeacon.org
                </a>
              </div>

              {/* Report a Booth */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Report a Booth</h3>
                <p className="text-neutral-600 mb-4">
                  Found wrong info or a new booth?
                </p>
                <a
                  href="mailto:booths@boothbeacon.org"
                  className="text-primary hover:underline font-medium"
                >
                  booths@boothbeacon.org
                </a>
              </div>

              {/* Press */}
              <div className="card-vintage rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Press & Partners</h3>
                <p className="text-neutral-600 mb-4">
                  Media inquiries and collaborations
                </p>
                <a
                  href="mailto:press@boothbeacon.org"
                  className="text-primary hover:underline font-medium"
                >
                  press@boothbeacon.org
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="max-w-2xl mx-auto">
              <div className="card-vintage rounded-lg p-8 md:p-12">
                <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-6 text-center">
                  Send Us a Message
                </h2>

                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                      <Send className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                      Message Sent!
                    </h3>
                    <p className="text-neutral-600">
                      Thanks for reaching out. We'll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Your Name
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Alexandra Roberts"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Subject
                      </label>
                      <Input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        placeholder="What's this about?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={6}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full btn-analog text-white border-0">
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="text-center mt-16">
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                Follow Us
              </h3>
              <div className="flex justify-center gap-6">
                <a
                  href="https://instagram.com/boothbeacon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-700 hover:bg-primary hover:text-white transition"
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a
                  href="https://twitter.com/boothbeacon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-700 hover:bg-primary hover:text-white transition"
                >
                  <Twitter className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
