import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as standard modern font
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
      <body className={cn(inter.variable, "min-h-screen flex flex-col bg-slate-50 font-sans antialiased")}>
        <header className="bg-ksa-green text-white py-4 shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-ksa-gold rounded-full flex items-center justify-center font-bold text-ksa-green">
                KSA
              </div>
              <h1 className="text-xl font-bold tracking-tight">Kenya School of Agriculture</h1>
            </div>
            <div className="text-sm font-medium text-ksa-gold/90">
              Admissions 2026
            </div>
          </div>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
          <p>© 2026 Kenya School of Agriculture. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
