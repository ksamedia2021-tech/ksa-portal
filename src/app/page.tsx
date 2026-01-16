'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/common';
import StepBioData from '@/components/StepBioData';
import StepDetails from '@/components/StepDetails';
import StepPayment from '@/components/StepPayment';
import StepSuccess from '@/components/StepSuccess';
import { PersonalDetailsData, AcademicDetailsData, PaymentData, ApplicationData } from '@/lib/schemas';

export default function Home() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ApplicationData>>({});
  const [calculatedAge, setCalculatedAge] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBioDataNext = (data: PersonalDetailsData, age: number) => {
    setFormData(prev => ({ ...prev, ...data, calculatedAge: age })); // Store calculated age
    setCalculatedAge(age);
    setStep(2);
  };

  const handleDetailsNext = (data: AcademicDetailsData) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(3);
  };

  const handlePaymentNext = async (data: PaymentData) => {
    const finalData = { ...formData, ...data };
    setIsSubmitting(true);

    try {
      // API call to submit application
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }

      setStep(4);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({});
    setCalculatedAge(0);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-t-4 border-t-ksa-green">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Student Application</h2>
            {step < 4 && <span className="text-sm font-medium text-slate-500">Step {step} of 3</span>}
          </div>

          {step < 4 && (
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-ksa-gold h-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <StepBioData
              defaultValues={formData as PersonalDetailsData}
              onNext={handleBioDataNext}
            />
          )}
          {step === 2 && (
            <StepDetails
              age={calculatedAge}
              defaultValues={formData as AcademicDetailsData}
              onNext={handleDetailsNext}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepPayment
              onNext={handlePaymentNext}
              onBack={() => setStep(2)}
              isSubmitting={isSubmitting}
            />
          )}
          {step === 4 && (
            <StepSuccess
              onReset={handleReset}
              courseTrack={(formData.courseTrack || (calculatedAge >= 21 ? 'CBET' : 'DIPLOMA')) as 'CBET' | 'DIPLOMA'}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
