import { Button } from "@/components/ui/common";
import { CheckCircle2, Download } from "lucide-react";

interface StepSuccessProps {
    onReset: () => void;
    courseTrack: 'CBET' | 'DIPLOMA';
}

const PDF_IDS = {
    CBET: '1uMgdaa8KGlWmyKz24V1HDUpn8z13CHh7',
    DIPLOMA: '1571BpZBELkh3p3j5LlRrj5gXQhQvuO2i'
};

export default function StepSuccess({ onReset, courseTrack }: StepSuccessProps) {
    const pdfUrl = `https://drive.google.com/uc?id=${courseTrack === 'CBET' ? PDF_IDS.CBET : PDF_IDS.DIPLOMA}&export=download`;

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
                    We have received your application. A copy of the application form has been sent to your email.
                </p>
                <p className="text-slate-500 text-sm">
                    You can also download it directly below:
                </p>
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full sm:w-auto">
                        <Download className="w-4 h-4 mr-2" />
                        Download {courseTrack} Application Form
                    </Button>
                </a>

                <Button onClick={onReset} variant="outline" className="text-xs">
                    Start New Application
                </Button>
            </div>
        </div>
    );
}
