import { z } from 'zod';

export const personalDetailsSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    nationalId: z.string().min(1, "National ID is required"),
    county: z.string().min(1, "County of residence is required"),
    dob: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
        message: "Valid date is required",
    }),
    calculatedAge: z.number().optional(),
});

export const academicDetailsSchema = z.object({
    courseTrack: z.enum(['CBET', 'DIPLOMA']),
    highestQualification: z.string().min(1, "Highest qualification is required"),
    kcseMeanGrade: z.enum(['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E']),
    preferredCampus: z.enum(['Nyeri', 'Thika', 'Ugenya', 'Ainabkoi']).optional(),
});

export const paymentSchema = z.object({
    mpesaCode: z.string().length(10, "M-PESA code must be exactly 10 characters").regex(/^[A-Z0-9]+$/i, "Code must be alphanumeric"),
});

// Merged schema for the final submission
export const applicationSchema = personalDetailsSchema.merge(academicDetailsSchema).merge(paymentSchema);

export type PersonalDetailsData = z.infer<typeof personalDetailsSchema>;
export type AcademicDetailsData = z.infer<typeof academicDetailsSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type ApplicationData = z.infer<typeof applicationSchema>;

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CORRECTION';
