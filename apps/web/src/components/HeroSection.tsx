import Image from "next/image";

export function HeroSection() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center text-center opacity-0 animate-slide-in-up">
      {/* Logo */}
      <div className="w-80 h-80 mb-8 relative opacity-0 animate-fade-in-scale animation-delay-400">
        <div className="w-full h-full animate-float">
        {/* Outer ring - gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-80 shadow-lg"></div>

        {/* Middle ring */}
        <div className="absolute inset-8 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-90 shadow-md"></div>

        {/* Inner circle with your logo */}
        <div className="absolute inset-16 bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden">
          <Image
            src="/logo.png"
            alt="Barangay Logo"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>

        {/* Decorative elements around the circle */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full opacity-20"></div>
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-indigo-500 rounded-full opacity-25"></div>
        <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 w-6 h-6 bg-slate-500 rounded-full opacity-20"></div>
                  <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 bg-blue-400 rounded-full opacity-15"></div>
        </div>
      </div>

      {/* Welcome text */}
      <div className="max-w-md opacity-0 animate-fade-in animation-delay-600">
        <h2 className="text-civic-hero mb-4">
          Barangay Governance Enhancement Platform
        </h2>
        <p className="text-civic-subtitle mb-2">
          Improving Monitoring, Performance, and Accountability for SGLGB
          Assessment
        </p>
        <p className="text-sm text-gray-500 mb-8 italic">
          "Linaw sa Pagsukat, Gabay sa Pag-unlad"
        </p>

        {/* Feature highlights */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-civic-body font-medium">
              SGLGB Online Submission Portal
            </span>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-sm"></div>
            <span className="text-civic-body font-medium">
              Automated Compliance Validation
            </span>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-slate-500 rounded-full shadow-sm"></div>
            <span className="text-civic-body font-medium">
              Performance Analytics for CapDev Planning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
