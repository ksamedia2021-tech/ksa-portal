import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalDetailsSchema, PersonalDetailsData } from '@/lib/schemas';
import { Input, Label, Button, Alert } from '@/components/ui/common';

interface StepBioDataProps {
    defaultValues?: Partial<PersonalDetailsData>;
    onNext: (data: PersonalDetailsData, age: number) => void;
}

export default function StepBioData({ defaultValues, onNext }: StepBioDataProps) {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<PersonalDetailsData>({
        resolver: zodResolver(personalDetailsSchema),
        defaultValues
    });

    const dob = watch('dob');

    const calculateAge = (dobString: string) => {
        if (!dobString) return 0;
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = calculateAge(dob);

    const onSubmit = (data: PersonalDetailsData) => {
        onNext(data, calculateAge(data.dob));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" {...register('fullName')} placeholder="Enter your full name" />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="john@example.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" {...register('phoneNumber')} placeholder="0712345678" />
                    {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
                </div>

                <div>
                    <Label htmlFor="nationalId">National ID (Optional)</Label>
                    <Input id="nationalId" {...register('nationalId')} placeholder="12345678" />
                </div>

                <div className="md:col-span-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" {...register('dob')} />
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
                </div>
            </div>

            {dob && !errors.dob && (
                <Alert variant={age >= 21 ? "default" : "info"} className={cn("mt-4 border-l-4", age >= 21 ? "border-ksa-green bg-green-50 text-green-900" : "border-blue-500 bg-blue-50 text-blue-900")}>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{age} Years Old</span> -
                        {age >= 21 ?
                            " Eligible for CBET Horticulture Producer Training" :
                            " Eligible for Diploma/Certificate in General Agriculture"
                        }
                    </div>
                </Alert>
            )}

            <div className="flex justify-end pt-4">
                <Button type="submit">Next Step</Button>
            </div>
        </form>
    );
}
