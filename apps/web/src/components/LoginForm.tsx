"use client";

import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { HiMail } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            Welcome, Partner in Governance
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Sign in to manage your SGLGB assessment
          </p>
        </div>

        {/* Form */}
        <form className="space-y-7">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-800 mb-3"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <HiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                className="input-base pl-12 h-12"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-800 mb-3"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <RiLockPasswordLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                className="input-base pl-12 h-12"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-2 pb-2">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
              />
              <label
                htmlFor="remember-me"
                className="ml-3 block text-sm font-medium text-gray-700"
              >
                Remember me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="btn-primary h-12 text-base font-semibold"
            >
              Sign in
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-6 bg-white text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="btn-secondary h-12 text-base font-semibold"
          >
            <FaGoogle className="w-5 h-5 mr-3" />
            Sign in with Google
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600">
            For account requests, please contact your DILG Administrator.
          </p>
        </form>
      </div>
    </div>
  );
}
