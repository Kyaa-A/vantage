"use client";

import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { HiMail } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  return (
    <div className="w-full max-w-xs lg:max-w-sm xl:max-w-md mx-auto opacity-0 animate-slide-in-up animation-delay-200">
      <div className="bg-white rounded-xl lg:rounded-2xl xl:rounded-3xl shadow-2xl border border-gray-100 p-4 lg:p-5 xl:p-6">
        {/* Header */}
        <div className="text-center mb-3 lg:mb-4 xl:mb-6">
          <h1 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-1 lg:mb-2 tracking-tight">
            Welcome, Partner in Governance
          </h1>
          <p className="text-xs lg:text-sm xl:text-base text-gray-600">
            Sign in to manage your SGLGB assessment
          </p>
        </div>

        {/* Form */}
        <form className="space-y-3 lg:space-y-4 xl:space-y-5">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 lg:pl-3 xl:pl-4 flex items-center pointer-events-none z-10">
                <HiMail className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                className="input-base pl-8 lg:pl-10 xl:pl-12 h-8 lg:h-9 xl:h-10"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs lg:text-sm font-semibold text-gray-800 mb-1 lg:mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 lg:pl-3 xl:pl-4 flex items-center pointer-events-none z-10">
                <RiLockPasswordLine className="h-3 w-3 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                className="input-base pl-8 lg:pl-10 xl:pl-12 h-8 lg:h-9 xl:h-10"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
              />
              <label
                htmlFor="remember-me"
                className="ml-1 lg:ml-2 block text-xs lg:text-sm font-medium text-gray-700"
              >
                Remember me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <div className="pt-1 lg:pt-2">
            <Button
              type="submit"
              className="btn-primary h-8 lg:h-9 xl:h-10 text-xs lg:text-sm xl:text-base font-semibold"
            >
              Sign in
            </Button>
          </div>

          {/* Divider */}
          <div className="relative py-1 lg:py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs lg:text-sm">
              <span className="px-3 lg:px-4 bg-white text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="btn-secondary h-8 lg:h-9 xl:h-10 text-xs lg:text-sm xl:text-base font-semibold"
          >
            <FaGoogle className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 mr-1 lg:mr-2" />
            Sign in with Google
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-xs lg:text-sm text-gray-600 pt-1">
            For account requests, please contact your DILG Administrator.
          </p>
        </form>
      </div>
    </div>
  );
}
