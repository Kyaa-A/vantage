import { LoginForm } from "@/components/LoginForm";
import { HeroSection } from "@/components/HeroSection";
import { BarangayFooter } from "@/components/BarangayFooter";

export default function Home() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* top right */}
        <div className="absolute -top-40 -right-40 w-48 h-48 lg:w-60 lg:h-60 xl:w-80 xl:h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-0 animate-fade-in-blob animation-delay-800 animate-blob"></div>
        {/* bottom left */}
        <div className="absolute -bottom-40 -left-40 w-48 h-48 lg:w-60 lg:h-60 xl:w-80 xl:h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-0 animate-fade-in-blob animation-delay-2000 animate-blob"></div>
        {/* top left */}
        <div className="absolute top-40 left-40 w-48 h-48 lg:w-60 lg:h-60 xl:w-80 xl:h-80 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-0 animate-fade-in-blob-light animation-delay-4000 animate-blob"></div>
      </div>

      {/* Mobile header for smaller screens */}
      <div className="lg:hidden flex-shrink-0 text-center z-20 opacity-0 animate-fade-in animation-delay-200 px-3 pt-4 pb-2">
        <h1 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1">
          SGLGB Assessment
        </h1>
        <p className="text-xs lg:text-sm xl:text-base text-gray-600">Partner in Governance Excellence</p>
      </div>

      {/* Main Content - flex-grow to fill available space */}
      <main className="flex-grow flex items-center justify-center p-2 lg:p-3 xl:p-4 relative z-10">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-center h-full">
          {/* Left side - hero section */}
          <HeroSection />

          {/* Right side - login form */}
          <div className="flex items-center justify-center">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Footer - sticks to bottom */}
      <div className="flex-shrink-0 z-10 opacity-0 animate-slide-in-up animation-delay-800">
        <BarangayFooter />
      </div>
    </div>
  );
}
