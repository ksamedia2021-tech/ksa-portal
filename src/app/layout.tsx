import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "KSA Student Application Portal",
  description: "Official Admissions Portal for Kenya School of Agriculture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(outfit.variable, "min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800")}>
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ksa-green/10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Logo Section */}
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ksa-logo.png"
                  alt="KSA Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-12 w-px bg-slate-200"></div>

              {/* Text Section */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none text-ksa-green uppercase">
                  Kenya School <br className="hidden sm:block" />
                  <span className="text-ksa-green">of Agriculture</span>
                </h1>
              </div>
            </div>

            <div className="hidden md:block text-sm font-semibold text-ksa-gold bg-ksa-green/5 px-4 py-2 rounded-full border border-ksa-green/10">
              Admissions 2026
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8 relative">
          {/* Background Pattern */}
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-50 via-slate-100 to-green-50/50"></div>

          {children}
        </main>

        <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm border-t border-slate-800">
          <p>© 2026 Kenya School of Agriculture. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
