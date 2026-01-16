import { Button } from "@/components/ui/common";
import { CheckCircle2 } from "lucide-react";

interface StepSuccessProps {
    onReset: () => void;
}

export default function StepSuccess({ onReset }: StepSuccessProps) {
    return (
        <div className="text-center py-10 space-y-6">
            <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="w-16 h-16 text-ksa-green" />
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Application Successful!</h2>
                <p className="text-slate-600 max-w-md mx-auto">
                    We have received your application. Please check your email for the downloadable PDF form.
                </p>
            </div>

            <div className="pt-4">
                <Button onClick={onReset} variant="outline">
                    Start New Application
                </Button>
            </div>
        </div>
    );
}
