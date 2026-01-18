import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { academicDetailsSchema, AcademicDetailsData } from '@/lib/schemas';
import { Label, Select, Button, Alert } from '@/components/ui/common';
import { useEffect } from 'react';

interface StepDetailsProps {
    age: number;
    defaultValues?: Partial<AcademicDetailsData>;
    onNext: (data: AcademicDetailsData) => void;
    onBack: () => void;
}

export default function StepDetails({ age, defaultValues, onNext, onBack }: StepDetailsProps) {
    const isCBET = age >= 21;
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AcademicDetailsData>({
        resolver: zodResolver(academicDetailsSchema),
        defaultValues: {
            ...defaultValues,
            courseTrack: isCBET ? 'CBET' : 'DIPLOMA',
            preferredCampus: !isCBET ? 'Thika' : undefined // Rule 2: Campus Fixed for Youth
        }
    });

    // Force set the correct track if it changes (though age shouldn't change here)
    useEffect(() => {
        setValue('courseTrack', isCBET ? 'CBET' : 'DIPLOMA');
        if (!isCBET) {
            setValue('preferredCampus', 'Thika');
        }
    }, [isCBET, setValue]);

    const kcseGrade = watch('kcseMeanGrade');

    // Validation Logic for Diploma
    const isGradeEligible = (grade?: string) => {
        if (!grade) return true; // Let Zod handle required check if we made it required
        const gradeValue = {
            'A': 12, 'A-': 11,
            'B+': 10, 'B': 9, 'B-': 8,
            'C+': 7, 'C': 6, 'C-': 5,
            'D+': 4, 'D': 3, 'D-': 2, 'E': 1
        };
        // Rule: Diploma requires C- (5) | Certificate requires D Plain (3). PRD says "Minimum requirement is D Plain".
        // "If Grade < D Plain (e.g. D- or E), show Error"

        // @ts-ignore
        const val = gradeValue[grade] || 0;
        return val >= 3;
    };

    const showGradeError = !isCBET && kcseGrade && !isGradeEligible(kcseGrade);

    const onSubmit = (data: AcademicDetailsData) => {
        if (!isCBET && !isGradeEligible(data.kcseMeanGrade)) {
            return; // Block submission
        }
        onNext(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">
                    {isCBET ? "Horticulture Producer Training (CBET)" : "Diploma / Certificate in General Agriculture"}
                </h3>
                <p className="text-sm text-slate-500">
                    {isCBET ? "Track for applicants aged 21 and above." : "Track for applicants aged below 21."}
                </p>
            </div>

            <div className="space-y-4">
                {/* 1. Qualification - Visible for Everyone */}
                <div>
                    <Label htmlFor="highestQualification">Highest Qualification</Label>
                    <Select id="highestQualification" {...register('highestQualification')}>
                        <option value="">-- Select Qualification --</option>
                        <option value="Degree">Degree</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Certificate">Certificate</option>
                        <option value="KCSE">KCSE Certificate</option>
                        {isCBET && <option value="CPE/KCPE">CPE/KCPE</option>}
                        {isCBET && <option value="None">None</option>}
                    </Select>
                    {errors.highestQualification && <p className="text-red-500 text-xs mt-1">{errors.highestQualification.message}</p>}
                </div>

                {/* 2. Grade - Visible for Everyone */}
                <div>
                    <Label htmlFor="kcseMeanGrade">KCSE Mean Grade</Label>
                    <Select id="kcseMeanGrade" {...register('kcseMeanGrade')}>
                        <option value="">-- Select Grade --</option>
                        <option value="A">A</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B">B</option>
                        <option value="B-">B-</option>
                        <option value="C+">C+</option>
                        <option value="C">C</option>
                        <option value="C-">C-</option>
                        <option value="D+">D+</option>
                        <option value="D">D (Plain)</option>
                        <option value="D-">D-</option>
                        <option value="E">E</option>
                    </Select>
                    {errors.kcseMeanGrade && <p className="text-red-500 text-xs mt-1">{errors.kcseMeanGrade.message}</p>}
                </div>

                {/* 3. Campus Selection or Fixed Display */}
                {isCBET ? (
                    <div>
                        <Label htmlFor="preferredCampus">Select Preferred Campus</Label>
                        <Select id="preferredCampus" {...register('preferredCampus')}>
                            <option value="">-- Select Campus --</option>
                            <option value="Nyeri">Nyeri Campus</option>
                            <option value="Thika">Thika Campus</option>
                            <option value="Ugenya">Ugenya Campus</option>
                            <option value="Ainabkoi">Ainabkoi Campus</option>
                        </Select>
                        {errors.preferredCampus && <p className="text-red-500 text-xs mt-1">{errors.preferredCampus.message}</p>}
                    </div>
                ) : (
                    <div className="opacity-75">
                        <Label>Campus</Label>
                        <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-600 text-sm">Thika Campus (Fixed)</div>
                    </div>
                )}

                {/* 4. Diploma Rules */}
                {!isCBET && (
                    <>
                        <Alert variant="info">
                            Diploma requires C- | Certificate requires D Plain
                        </Alert>
                        {showGradeError && (
                            <Alert variant="destructive">
                                Error: Minimum requirement is D Plain. You are not eligible to proceed.
                            </Alert>
                        )}
                    </>
                )}
            </div>



            <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                <Button type="submit" disabled={!!showGradeError}>Next Step</Button>
            </div>
        </form>
    );
}
