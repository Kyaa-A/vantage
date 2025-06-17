import { LoginForm } from "@/components/LoginForm";
import { HeroSection } from "@/components/HeroSection";
import { BarangayFooter } from "@/components/BarangayFooter";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* top right */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-0 animate-fade-in-blob animation-delay-800 animate-blob"></div>
        {/* bottom left */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-0 animate-fade-in-blob animation-delay-2000 animate-blob"></div>
        {/* top left */}
        <div className="absolute top-40 left-40 w-80 h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-0 animate-fade-in-blob-light animation-delay-4000 animate-blob"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - hero section */}
        <HeroSection />

        {/* Right side - login form */}
        <div className="flex items-center justify-center">
          <LoginForm />
        </div>
      </div>

      {/* Mobile header for smaller screens */}
      <div className="lg:hidden absolute top-8 left-0 right-0 text-center z-20 opacity-0 animate-fade-in animation-delay-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          SGLGB Assessment
        </h1>
        <p className="text-gray-600">Partner in Governance Excellence</p>
      </div>

      {/* Footer - positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 opacity-0 animate-slide-in-up animation-delay-800">
        <BarangayFooter />
      </div>
    </main>
  );
}
