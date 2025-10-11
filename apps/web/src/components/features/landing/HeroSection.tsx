"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, CheckCircle2, Play, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCTAClick = () => {
    // Add a subtle animation effect before navigation
    setShowDemo(true);
    setTimeout(() => {
      window.location.href = "/login";
    }, 300);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-gradient-to-b from-[#F9FAFB] to-white overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#fbbf24]/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-[#1A3A6D]/10 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto w-full py-8 md:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-28 xl:gap-32 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 lg:pr-8 xl:pr-12">
            {/* Trust Badge */}
            <div
              className={`inline-flex items-center gap-2 bg-[#1A3A6D]/5 text-[#1A3A6D] px-4 py-2 rounded-full text-sm font-medium transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Official Tool for DILG-Sulop
            </div>

            {/* Headline */}
            <div>
              <h1
                className={`text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-black mb-4 transition-all duration-1000 delay-200 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                <span className="whitespace-nowrap block leading-tight">
                  Empowering Barangays
                </span>
                <span className="whitespace-nowrap block leading-tight">
                  for SGLGB{" "}
                  <span className="text-[#fbbf24] animate-pulse">Success</span>
                </span>
              </h1>
              <p
                className={`text-lg text-gray-600 max-w-2xl transition-all duration-1000 delay-400 ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >
                The official pre-assessment and analytics web application for
                the SGLGB. A guided, transparent, and efficient digital workflow
                for the Barangays of Sulop.
              </p>
            </div>

            {/* Feature Pills Grid */}
            <ul
              className={`space-y-3 transition-all duration-1000 delay-600 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <li className="flex items-start gap-3 group">
                <CheckCircle2 className="mt-0.5 w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-semibold text-base text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                  Guided Self-Assessment
                </span>
              </li>
              <li className="flex items-start gap-3 group">
                <CheckCircle2 className="mt-0.5 w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-semibold text-base text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                  Structured Rework & Feedback
                </span>
              </li>
              <li className="flex items-start gap-3 group">
                <CheckCircle2 className="mt-0.5 w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-semibold text-base text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                  Automated Scoring
                </span>
              </li>
              <li className="flex items-start gap-3 group">
                <CheckCircle2 className="mt-0.5 w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-semibold text-base text-gray-800 group-hover:text-gray-900 transition-colors duration-200">
                  AI-Powered Insights
                </span>
              </li>
            </ul>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-800 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <Button
                onClick={handleCTAClick}
                className={`group bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 transition-all duration-300 font-medium px-8 py-4 text-lg rounded-lg border-0 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                  showDemo
                    ? "animate-pulse bg-green-500 hover:bg-green-600"
                    : ""
                }`}
              >
                {showDemo ? (
                  <>
                    <Play className="mr-2 w-5 h-5 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Access Login Portal
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const processSection = document.getElementById("process");
                  if (processSection) {
                    processSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="group border-2 border-[#1A3A6D] text-[#1A3A6D] hover:bg-[#1A3A6D] hover:text-white transition-all duration-300 font-medium px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Learn More
                <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div
            className={`relative lg:pl-8 xl:pl-12 transition-all duration-1000 delay-1000 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
          >
            {/* Main Monitor Visual */}
            <div className="relative transform rotate-2 lg:scale-[1.15] xl:scale-[1.2] origin-center rounded-2xl overflow-hidden shadow-2xl border border-[#fbbf24] bg-[#fbbf24] p-2 hover:scale-[1.18] transition-transform duration-500">
              <Image
                src="/Scenery/Sulop_Hall.png"
                alt="Sulop Municipal Hall"
                width={1000}
                height={750}
                className="w-full h-auto rounded-lg border border-[#fbbf24]"
              />
            </div>

            {/* Floating Data Cards - Spread Positioning with enhanced animations */}
            {/* Top Left Badge */}
            <div
              className={`absolute -top-14 -left-8 md:-top-16 md:-left-10 bg-white/95 rounded-full shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2 w-max transform rotate-2 hover:-translate-y-1 hover:scale-105 transition-all duration-300 animate-float-slow ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4"
              }`}
              style={{ animationDelay: "1.2s" }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-600 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">
                Validated Submission
              </span>
            </div>

            {/* Top Right Badge */}
            <div
              className={`absolute -top-6 -right-6 md:-top-8 md:-right-8 bg-white/95 rounded-full shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2 w-max transform rotate-2 hover:-translate-x-1 hover:scale-105 transition-all duration-300 animate-float-slow ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4"
              }`}
              style={{ animationDelay: "1.4s" }}
            >
              <Users className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">
                25 Barangays Connected
              </span>
            </div>

            {/* Bottom Right Badge */}
            <div
              className={`absolute -bottom-8 -right-6 md:-bottom-10 md:-right-8 bg-white/95 rounded-full shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2 w-max transform rotate-2 hover:translate-y-1 hover:scale-105 transition-all duration-300 animate-float-slow ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{ animationDelay: "1.6s" }}
            >
              <BarChart3 className="w-4 h-4 text-purple-600 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">
                95% Compliance Rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
