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
            preferredCampus: defaultValues?.preferredCampus || (isCBET ? undefined : 'Thika')
        }
    });

    // Force set the correct track if it changes (though age shouldn't change here)
    useEffect(() => {
        setValue('courseTrack', isCBET ? 'CBET' : 'DIPLOMA');
    }, [isCBET, setValue]);

    const kcseGrade = watch('kcseMeanGrade');
    const selectedCampus = watch('preferredCampus');

    // Validation Logic for Diploma / Certificate
    const getAcademicLevel = (grade?: string) => {
        if (!grade) return null;
        const gradeValue: Record<string, number> = {
            'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8, 'C+': 7, 'C': 6, 'C-': 5,
            'D+': 4, 'D': 3, 'D-': 2, 'E': 1
        };
        const val = gradeValue[grade] || 0;

        if (val >= 5) return 'DIPLOMA';
        if (val >= 3) return 'CERTIFICATE';
        return 'INELIGIBLE';
    };

    const academicLevel = getAcademicLevel(kcseGrade);
    const showGradeError = !isCBET && academicLevel === 'INELIGIBLE';

    const onSubmit = (data: AcademicDetailsData) => {
        if (!isCBET && getAcademicLevel(data.kcseMeanGrade) === 'INELIGIBLE') {
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

                {/* 3. Campus Selection */}
                <div>
                    <Label htmlFor="preferredCampus">Select Preferred Campus</Label>
                    <Select id="preferredCampus" {...register('preferredCampus')}>
                        <option value="">-- Select Campus --</option>
                        {isCBET ? (
                            <>
                                <option value="Nyeri">Nyeri Campus</option>
                                <option value="Thika">Thika Campus</option>
                                <option value="Ugenya">Ugenya Campus</option>
                                <option value="Ainabkoi">Ainabkoi Campus</option>
                            </>
                        ) : (
                            <>
                                <option value="Thika">Thika Campus</option>
                                <option value="Ainabkoi">Ainabkoi Campus</option>
                            </>
                        )}
                    </Select>
                    {errors.preferredCampus && <p className="text-red-500 text-xs mt-1">{errors.preferredCampus.message}</p>}
                    {!isCBET && (
                        <p className="text-xs text-slate-500 mt-1">Available campuses for this track: Thika or Ainabkoi</p>
                    )}
                </div>

                {/* 4. Track Specific Logic / Information */}
                {!isCBET && kcseGrade && (
                    <div className="space-y-3">
                        {academicLevel === 'DIPLOMA' && (
                            <Alert variant="info" className="bg-blue-50 border-blue-200">
                                <div className="font-semibold text-blue-800">Application Level: Diploma</div>
                                <div className="text-xs text-blue-600">Based on your C- or above grade, you qualify for the Diploma program.</div>
                            </Alert>
                        )}
                        {academicLevel === 'CERTIFICATE' && (
                            <Alert variant="info" className="bg-green-50 border-green-200">
                                <div className="font-semibold text-green-800">Application Level: Certificate</div>
                                <div className="text-xs text-green-600">Based on your D Plain grade, you qualify for the Certificate program.</div>
                            </Alert>
                        )}
                        {showGradeError && (
                            <Alert variant="destructive">
                                Error: Minimum requirement is D Plain. You are not eligible to proceed with this track.
                            </Alert>
                        )}
                    </div>
                )}
            </div>



            <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack}>Back</Button>
                <Button type="submit" disabled={!!showGradeError}>Next Step</Button>
            </div>
        </form>
    );
}
