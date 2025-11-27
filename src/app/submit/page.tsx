'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, MapPin, Upload, Check, Info } from 'lucide-react';

export default function SubmitBoothPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    machineModel: '',
    photoType: '',
    acceptsCash: true,
    acceptsCard: false,
    cost: '',
    description: '',
    submitterEmail: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to the API
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-secondary via-white to-secondary film-grain">
        {/* Hero */}
        <section className="py-16 px-4 text-center warm-glow">
          <div className="max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-semibold text-neutral-900 mb-6">
              Submit a Booth
            </h1>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              Found a photo booth that&apos;s not on our map? Help the community by adding it to our directory.
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="card-vintage rounded-lg p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-photo">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-4">
                  Thank You!
                </h2>
                <p className="text-neutral-600 mb-6">
                  Your booth submission has been received. Our team will review it and add it to the
                  directory within 24-48 hours. We&apos;ll email you when it&apos;s live!
                </p>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      address: '',
                      city: '',
                      country: '',
                      machineModel: '',
                      photoType: '',
                      acceptsCash: true,
                      acceptsCard: false,
                      cost: '',
                      description: '',
                      submitterEmail: '',
                    });
                  }}
                  variant="outline"
                >
                  Submit Another Booth
                </Button>
              </div>
            ) : (
              <div className="card-vintage rounded-lg p-8 md:p-12">
                {/* Tips */}
                <div className="bg-secondary rounded-lg p-4 mb-8 flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-neutral-700">
                    <strong>Tips for a great submission:</strong>
                    <ul className="mt-2 space-y-1 list-disc pl-4">
                      <li>Be as specific as possible with the location</li>
                      <li>Include the venue name if it&apos;s inside a business</li>
                      <li>Note if it&apos;s cash-only or accepts cards</li>
                    </ul>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Location Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Location Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Booth Name / Venue *
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="e.g., Ace Hotel Lobby, Berlin Kreuzberg Station"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Street Address *
                        </label>
                        <Input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            City *
                          </label>
                          <Input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                            placeholder="Berlin"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Country *
                          </label>
                          <Input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            required
                            placeholder="Germany"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booth Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      Booth Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Machine Model
                          </label>
                          <Select
                            value={formData.machineModel}
                            onValueChange={(value) => setFormData({ ...formData, machineModel: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select or unknown" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unknown">Don&apos;t know</SelectItem>
                              <SelectItem value="Photo-Me Model 9">Photo-Me Model 9</SelectItem>
                              <SelectItem value="Photo-Me Model 11">Photo-Me Model 11</SelectItem>
                              <SelectItem value="Photomatic">Photomatic</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Photo Type
                          </label>
                          <Select
                            value={formData.photoType}
                            onValueChange={(value) => setFormData({ ...formData, photoType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="black-and-white">Black & White</SelectItem>
                              <SelectItem value="color">Color</SelectItem>
                              <SelectItem value="both">Both available</SelectItem>
                              <SelectItem value="unknown">Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Cost (approximate)
                          </label>
                          <Input
                            type="text"
                            value={formData.cost}
                            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            placeholder="e.g., $4, €3, 2 coins"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Payment
                          </label>
                          <div className="flex gap-4 mt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.acceptsCash}
                                onChange={(e) => setFormData({ ...formData, acceptsCash: e.target.checked })}
                                className="rounded border-neutral-300"
                              />
                              <span className="text-sm text-neutral-700">Cash</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.acceptsCard}
                                onChange={(e) => setFormData({ ...formData, acceptsCard: e.target.checked })}
                                className="rounded border-neutral-300"
                              />
                              <span className="text-sm text-neutral-700">Card</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Additional Details
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="Any helpful tips? Hours, access instructions, nearby landmarks..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Your Info */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Your Email (optional)
                    </label>
                    <Input
                      type="email"
                      value={formData.submitterEmail}
                      onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                      placeholder="We'll notify you when the booth is added"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      We&apos;ll only use this to let you know when your submission goes live.
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="w-full btn-analog text-white border-0">
                    <Upload className="w-5 h-5 mr-2" />
                    Submit Booth
                  </Button>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
