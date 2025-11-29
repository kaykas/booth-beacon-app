'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';
import { toast } from 'sonner';

type BoothInsert = Database['public']['Tables']['booths']['Insert'];

// Common machine models
const MACHINE_MODELS = [
  'Photo-Me',
  'Photo-Automat',
  'Photomaton',
  'Photobooth',
  'Purikura',
  'Analog Photo Booth',
  'Digital Photo Booth',
  'Unknown',
  'Other',
];

interface FormData {
  name: string;
  address: string;
  city: string;
  country: string;
  state: string;
  postal_code: string;
  machine_model: string;
  booth_type: string;
  photo_type: string;
  description: string;
  cost: string;
  hours: string;
  accepts_cash: boolean;
  accepts_card: boolean;
  photo_url: string;
}

const initialFormData: FormData = {
  name: '',
  address: '',
  city: '',
  country: '',
  state: '',
  postal_code: '',
  machine_model: '',
  booth_type: '',
  photo_type: '',
  description: '',
  cost: '',
  hours: '',
  accepts_cash: false,
  accepts_card: false,
  photo_url: '',
};

export default function SubmitBoothPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (name: 'accepts_cash' | 'accepts_card', checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Booth name is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate slug from name
      const slug = generateSlug(formData.name);

      // Prepare data for submission
      const submissionData: BoothInsert = {
        name: formData.name.trim(),
        slug,
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        state: formData.state.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        latitude: null,
        longitude: null,
        coordinates: null,
        machine_model: formData.machine_model || null,
        machine_year: null,
        machine_manufacturer: null,
        machine_serial: null,
        booth_type: (formData.booth_type as BoothInsert['booth_type']) || null,
        photo_type: (formData.photo_type as BoothInsert['photo_type']) || null,
        operator_id: null,
        operator_name: null,
        photo_exterior_url: formData.photo_url.trim() || null,
        photo_interior_url: null,
        photo_sample_strips: null,
        ai_preview_url: null,
        ai_preview_generated_at: null,
        status: 'unverified',
        is_operational: true,
        hours: formData.hours.trim() || null,
        cost: formData.cost.trim() || null,
        accepts_cash: formData.accepts_cash,
        accepts_card: formData.accepts_card,
        description: formData.description.trim() || null,
        historical_notes: null,
        access_instructions: null,
        features: null,
        source_primary: 'user_submission',
        source_urls: null,
        source_verified_date: null,
        last_verified: null,
      };

      const { error } = await supabase
        .from('booths')
        .insert([submissionData] as never)
        .select()
        .single();

      if (error) {
        console.error('Submission error:', error);
        toast.error('Failed to submit booth. Please try again.');
        return;
      }

      // Success!
      setIsSuccess(true);
      toast.success('Booth submitted successfully!');

      // Clear form
      setFormData(initialFormData);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/map');
      }, 3000);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center card-vintage">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-4">
            Thank You!
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Your booth submission has been received. We&apos;ll review it and add it to the map soon!
          </p>
          <Button asChild className="btn-analog text-white border-0">
            <Link href="/map">View Map</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-semibold text-foreground">
                Submit a Booth
              </h1>
              <p className="text-muted-foreground mt-1">
                Help us grow the community by adding a photo booth
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="p-6 card-vintage">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booth Name */}
              <div className="md:col-span-2">
                <Label htmlFor="name" className="text-foreground mb-2 block">
                  Booth Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Photo-Me at Central Station"
                  className={errors.name ? 'border-error' : ''}
                  required
                />
                {errors.name && (
                  <p className="text-error text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-foreground mb-2 block">
                  Street Address <span className="text-primary">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Main Street"
                  className={errors.address ? 'border-error' : ''}
                  required
                />
                {errors.address && (
                  <p className="text-error text-sm mt-1">{errors.address}</p>
                )}
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city" className="text-foreground mb-2 block">
                  City <span className="text-primary">*</span>
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Berlin"
                  className={errors.city ? 'border-error' : ''}
                  required
                />
                {errors.city && (
                  <p className="text-error text-sm mt-1">{errors.city}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="country" className="text-foreground mb-2 block">
                  Country <span className="text-primary">*</span>
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g., Germany"
                  className={errors.country ? 'border-error' : ''}
                  required
                />
                {errors.country && (
                  <p className="text-error text-sm mt-1">{errors.country}</p>
                )}
              </div>

              {/* State/Region */}
              <div>
                <Label htmlFor="state" className="text-foreground mb-2 block">
                  State/Region
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g., Berlin"
                />
              </div>

              {/* Postal Code */}
              <div>
                <Label htmlFor="postal_code" className="text-foreground mb-2 block">
                  Postal Code
                </Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="e.g., 10115"
                />
              </div>
            </div>
          </Card>

          {/* Machine Details */}
          <Card className="p-6 card-vintage">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
              Machine Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Machine Model */}
              <div>
                <Label htmlFor="machine_model" className="text-foreground mb-2 block">
                  Machine Model
                </Label>
                <Select
                  value={formData.machine_model}
                  onValueChange={(value) => handleSelectChange('machine_model', value)}
                >
                  <SelectTrigger id="machine_model">
                    <SelectValue placeholder="Select model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MACHINE_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Booth Type */}
              <div>
                <Label htmlFor="booth_type" className="text-foreground mb-2 block">
                  Booth Type
                </Label>
                <Select
                  value={formData.booth_type}
                  onValueChange={(value) => handleSelectChange('booth_type', value)}
                >
                  <SelectTrigger id="booth_type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analog">Analog</SelectItem>
                    <SelectItem value="chemical">Chemical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="instant">Instant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Type */}
              <div>
                <Label htmlFor="photo_type" className="text-foreground mb-2 block">
                  Photo Type
                </Label>
                <Select
                  value={formData.photo_type}
                  onValueChange={(value) => handleSelectChange('photo_type', value)}
                >
                  <SelectTrigger id="photo_type">
                    <SelectValue placeholder="Select photo type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black-and-white">Black & White</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Visit Information */}
          <Card className="p-6 card-vintage">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
              Visit Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cost */}
              <div>
                <Label htmlFor="cost" className="text-foreground mb-2 block">
                  Cost
                </Label>
                <Input
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="e.g., $5 or 4 EUR"
                />
              </div>

              {/* Hours */}
              <div>
                <Label htmlFor="hours" className="text-foreground mb-2 block">
                  Hours
                </Label>
                <Input
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  placeholder="e.g., 24/7 or 9am-9pm"
                />
              </div>

              {/* Payment Methods */}
              <div className="md:col-span-2">
                <Label className="text-foreground mb-3 block">Payment Methods</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_cash"
                      checked={formData.accepts_cash}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('accepts_cash', checked as boolean)
                      }
                    />
                    <label
                      htmlFor="accepts_cash"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Accepts Cash
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_card"
                      checked={formData.accepts_card}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('accepts_card', checked as boolean)
                      }
                    />
                    <label
                      htmlFor="accepts_card"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Accepts Card
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Information */}
          <Card className="p-6 card-vintage">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
              Additional Information
            </h2>
            <div className="space-y-6">
              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-foreground mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about this booth... What makes it special? Any tips for visitors?"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Share any helpful details about the booth, its location, or your experience
                </p>
              </div>

              {/* Photo URL */}
              <div>
                <Label htmlFor="photo_url" className="text-foreground mb-2 block">
                  Photo URL
                </Label>
                <Input
                  id="photo_url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/photo.jpg"
                  type="url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Link to a photo of the booth exterior
                </p>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-analog text-white border-0 min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Submit Booth
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
