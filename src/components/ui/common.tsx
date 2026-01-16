
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={cn("block text-sm font-semibold text-slate-700 mb-1 ml-1", className)} {...props} />
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                className={cn(
                    "flex h-11 w-full rounded-lg input-glass px-3 py-2 text-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost', isLoading?: boolean }>(
    ({ className, variant = 'primary', isLoading, children, ...props }, ref) => {
        const variants = {
            primary: "bg-ksa-green text-white hover:bg-green-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
            secondary: "bg-ksa-gold text-ksa-green hover:bg-yellow-500 shadow-md",
            outline: "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700",
            ghost: "bg-transparent hover:bg-slate-100 text-slate-600"
        };
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ksa-green focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0",
                    variants[variant],
                    className
                )}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div className="relative">
                <select
                    className={cn(
                        "flex h-11 w-full items-center justify-between rounded-lg input-glass px-3 py-2 text-sm placeholder:text-slate-400 appearance-none disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        );
    }
);
Select.displayName = "Select";

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("glass-panel rounded-2xl", className)} {...props}>
        {children}
    </div>
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 p-6 border-b border-slate-100/50", className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6", className)} {...props} />
);

export const Alert = ({ className, variant = "default", children, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" | "warning" | "info" }) => {
    const variants = {
        default: "bg-slate-100 text-slate-800 border-slate-200",
        destructive: "bg-red-50 text-red-900 border-red-200",
        warning: "bg-amber-50 text-amber-900 border-amber-200",
        info: "bg-blue-50 text-blue-900 border-blue-200"
    };
    return (
        <div role="alert" className={cn("rounded-lg p-4 text-sm font-medium border shadow-sm", variants[variant], className)} {...props}>
            {children}
        </div>
    );
};
