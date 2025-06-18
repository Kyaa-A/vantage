import Image from "next/image";

export function HeroSection() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center text-center opacity-0 animate-slide-in-up">
      {/* Logo */}
      <div className="w-40 h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 mb-3 lg:mb-4 xl:mb-6 relative opacity-0 animate-fade-in-scale animation-delay-400">
        <div className="w-full h-full animate-float">
        {/* Outer ring - gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-80 shadow-lg"></div>

        {/* Middle ring */}
        <div className="absolute inset-3 lg:inset-4 xl:inset-5 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-90 shadow-md"></div>

        {/* Inner circle with your logo */}
        <div className="absolute inset-6 lg:inset-8 xl:inset-10 bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden">
          <Image
            src="/logo.png"
            alt="Barangay Logo"
            width={100}
            height={100}
            className="object-contain lg:w-[120px] lg:h-[120px] xl:w-[140px] xl:h-[140px]"
            priority
          />
        </div>

        {/* Decorative elements around the circle */}
        <div className="absolute -top-1 lg:-top-2 xl:-top-3 left-1/2 transform -translate-x-1/2 w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 bg-blue-500 rounded-full opacity-20"></div>
        <div className="absolute -bottom-1 lg:-bottom-2 xl:-bottom-3 left-1/2 transform -translate-x-1/2 w-2 h-2 lg:w-3 lg:h-3 xl:w-4 xl:h-4 bg-indigo-500 rounded-full opacity-25"></div>
        <div className="absolute top-1/2 -left-1 lg:-left-2 xl:-left-3 transform -translate-y-1/2 w-2 h-2 lg:w-3 lg:h-3 xl:w-4 xl:h-4 bg-slate-500 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 -right-1 lg:-right-2 xl:-right-3 transform -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 bg-blue-400 rounded-full opacity-15"></div>
        </div>
      </div>

      {/* Welcome text */}
      <div className="max-w-xs lg:max-w-sm xl:max-w-md opacity-0 animate-fade-in animation-delay-600">
        <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-2 lg:mb-3">
          Barangay Governance Enhancement Platform
        </h2>
        <p className="text-xs lg:text-sm xl:text-base text-gray-600 mb-2">
          Improving Monitoring, Performance, and Accountability for SGLGB
          Assessment
        </p>
        <p className="text-xs lg:text-sm text-gray-500 mb-3 lg:mb-4 xl:mb-6 italic">
          "Linaw sa Pagsukat, Gabay sa Pag-unlad"
        </p>

        {/* Feature highlights */}
        <div className="space-y-2 lg:space-y-3">
          <div className="flex items-center justify-center space-x-2 lg:space-x-3">
            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-gray-700 font-medium text-xs lg:text-sm xl:text-base">
              SGLGB Online Submission Portal
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2 lg:space-x-3">
            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-indigo-500 rounded-full shadow-sm"></div>
            <span className="text-gray-700 font-medium text-xs lg:text-sm xl:text-base">
              Automated Compliance Validation
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2 lg:space-x-3">
            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-slate-500 rounded-full shadow-sm"></div>
            <span className="text-gray-700 font-medium text-xs lg:text-sm xl:text-base">
              Performance Analytics for CapDev Planning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
