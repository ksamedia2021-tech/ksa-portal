import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema, PaymentData } from '@/lib/schemas';
import { Input, Label, Button, Alert } from '@/components/ui/common';
import { useState } from 'react';

interface StepPaymentProps {
    onNext: (data: PaymentData) => void;
    onBack: () => void;
    isSubmitting: boolean;
}

export default function StepPayment({ onNext, onBack, isSubmitting }: StepPaymentProps) {
    const { register, handleSubmit, formState: { errors } } = useForm<PaymentData>({
        resolver: zodResolver(paymentSchema)
    });

    const onSubmit = (data: PaymentData) => {
        onNext(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-ksa-green mb-2">Payment Instructions</h4>
                <p className="text-sm text-slate-600 mb-4">Please make a payment of <span className="font-bold">Ksh 1,000</span> via M-PESA.</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-slate-100">
                        <span className="block text-slate-500 text-xs uppercase tracking-wider">Paybill</span>
                        <span className="font-mono font-bold text-lg">522 522</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-100">
                        <span className="block text-slate-500 text-xs uppercase tracking-wider">Account</span>
                        <span className="font-mono font-bold text-lg">1278283447</span>
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="mpesaCode">M-PESA Transaction Code</Label>
                <Input
                    id="mpesaCode"
                    placeholder="e.g. QWE1234567"
                    className="uppercase font-mono tracking-widest"
                    maxLength={10}
                    {...register('mpesaCode')}
                />
                <p className="text-xs text-slate-500 mt-1">Must be exactly 10 characters.</p>
                {errors.mpesaCode && <p className="text-red-500 text-xs mt-1">{errors.mpesaCode.message}</p>}
            </div>

            <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
            </div>
        </form>
    );
}
