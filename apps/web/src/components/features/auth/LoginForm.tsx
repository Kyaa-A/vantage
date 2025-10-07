// 🚀 Modern login form using auto-generated React Query hooks
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useGetUsersMe, usePostAuthLogin } from "@vantage/shared";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

/**
 * Login form component with authentication and redirect logic
 *
 * Uses the auto-generated usePostAuthLogin hook and integrates with
 * the Zustand auth store for state management.
 */
interface LoginFormProps {
  isDarkMode?: boolean;
}

export default function LoginForm({ isDarkMode = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shouldFetchUser, setShouldFetchUser] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Small entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Prevent any form submission on the page
  useEffect(() => {
    const preventFormSubmit = (e: Event) => {
      if (e.type === "submit") {
        console.log("Global form submit prevented");
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("submit", preventFormSubmit, true);

    return () => {
      document.removeEventListener("submit", preventFormSubmit, true);
    };
  }, []);

  // Get auth store actions
  const { setToken, setUser } = useAuthStore();

  // Auto-generated login mutation hook
  const loginMutation = usePostAuthLogin({
    mutation: {
      onSuccess: (response) => {
        console.log("Login successful:", response);

        // Extract token from response
        const accessToken = response.access_token;

        if (!accessToken) {
          console.error("No access token received from server");
          return;
        }

        // Store token in auth store
        setToken(accessToken);
        setLoginSuccess(true);

        // Show success message with animation
        toast.success("🎉 Welcome back! Redirecting to your dashboard...", {
          duration: 3000,
          style: {
            background: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#1f2937",
            border: `1px solid ${isDarkMode ? "#fbbf24" : "#f59e0b"}`,
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
          },
        });

        // Trigger user data fetch
        setShouldFetchUser(true);
      },
      onError: (error) => {
        console.error("Login failed:", error);
        console.log("Error type:", typeof error);
        console.log("Error details:", error);

        // Show error toast with specific message
        toast.error("Wrong email or password", {
          duration: 3000,
          style: {
            background: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#ffffff" : "#1f2937",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
            fontWeight: "500",
          },
        });

        // Error handled successfully - no navigation needed
      },
      retry: false, // Disable retry to prevent multiple requests
      onSettled: (data, error) => {
        console.log("Mutation settled - Data:", data, "Error:", error);
        if (error) {
          console.log("Error in onSettled:", error);
        }
      },
    },
  });

  // Auto-generated hook to fetch current user data
  const userQuery = useGetUsersMe();

  // Handle user data fetch success/error
  useEffect(() => {
    if (shouldFetchUser) {
      // Trigger user data fetch
      userQuery.refetch().then((result) => {
        if (result.data) {
          console.log("User data fetched:", result.data);
          // Store user in auth store
          setUser(result.data);

          // Check for redirect parameter first, then fall back to dashboard
          const redirectTo = searchParams.get("redirect");
          let targetPath;

          if (redirectTo) {
            // Validate the redirect path to prevent open redirects
            const isValidRedirect =
              redirectTo.startsWith("/blgu/") ||
              redirectTo.startsWith("/mlgoo/") ||
              redirectTo.startsWith("/user-management/") ||
              redirectTo.startsWith("/change-password");

            if (isValidRedirect) {
              targetPath = redirectTo;
            } else {
              // Fall back to dashboard if redirect is invalid
              const isAdmin =
                result.data.role === "SUPERADMIN" ||
                result.data.role === "MLGOO_DILG";
              const isAssessor = result.data.role === "AREA_ASSESSOR";

              if (isAdmin) {
                targetPath = "/mlgoo/dashboard";
              } else if (isAssessor) {
                targetPath = "/assessor/submissions";
              } else {
                targetPath = "/blgu/dashboard";
              }
            }
          } else {
            // No redirect parameter, go to appropriate dashboard
            const isAdmin =
              result.data.role === "SUPERADMIN" ||
              result.data.role === "MLGOO_DILG";
            const isAssessor = result.data.role === "AREA_ASSESSOR";

            if (isAdmin) {
              targetPath = "/mlgoo/dashboard";
            } else if (isAssessor) {
              targetPath = "/assessor/submissions";
            } else {
              targetPath = "/blgu/dashboard";
            }
          }

          router.replace(targetPath);
        } else if (result.error) {
          console.error("Failed to fetch user data:", result.error);
          // Even if user fetch fails, we can still redirect to dashboard
          // Since we don't have user data, redirect to login to be safe
          router.replace("/login");
        }
        // Reset the flag
        setShouldFetchUser(false);
      });
    }
  }, [shouldFetchUser, userQuery, setUser, router, searchParams]);

  // Show toast on login success
  useEffect(() => {
    if (loginMutation.isSuccess) {
      toast.success("Login Successfully");
    }
  }, [loginMutation.isSuccess]);

  const handleSubmit = (e: React.MouseEvent | React.FormEvent) => {
    console.log("Submit triggered", e.type);
    e.preventDefault();
    e.stopPropagation();

    // Additional prevention for any potential form submission
    if (e.type === "submit") {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const credentials = {
      email,
      password,
    };

    console.log("Submitting credentials:", credentials);

    // Use regular mutate instead of mutateAsync to prevent form refresh
    try {
      loginMutation.mutate({ data: credentials });
    } catch (error) {
      console.error("Mutation error caught:", error);
      // Error should be handled by onError callback
    }

    // Return false to prevent any default behavior
    return false;
  };

  // Get error message for display
  const getErrorMessage = () => {
    if (!loginMutation.error) return null;

    // Handle different error types
    if (loginMutation.error instanceof Error) {
      // Check if it's a 401 error and provide user-friendly message
      if (loginMutation.error.message.includes("401")) {
        return "Incorrect email or password. Please try again.";
      }
      return loginMutation.error.message;
    }

    // Handle API error responses
    if (
      typeof loginMutation.error === "object" &&
      loginMutation.error !== null
    ) {
      const apiError = loginMutation.error as {
        response?: { data?: { detail?: string }; status?: number };
        message?: string;
      };

      // Check for 401 status code
      if (apiError.response?.status === 401) {
        return "Incorrect email or password. Please try again.";
      }

      if (apiError.response?.data?.detail) {
        return apiError.response.data.detail;
      }
      if (apiError.message) {
        return apiError.message;
      }
    }

    return "Incorrect email or password. Please try again.";
  };

  return (
    <div className="space-y-4">
      {Boolean(loginMutation.isPending) ? (
        <>
          <div className={`transition-colors duration-200`}>
            <Label
              className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email
            </Label>
            <Skeleton shape="rounded" size="lg" width="full" className="mb-2" />
          </div>
          <div className={`mt-4`}>
            <Label
              className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Password
            </Label>
            <Skeleton shape="rounded" size="lg" width="full" className="mb-2" />
          </div>
          <div className={`mt-4`}>
            <Skeleton shape="rounded" size="lg" width="full" className="mt-4" />
          </div>
        </>
      ) : (
        <>
          <div
            className={`transition-all duration-500 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <Label
              htmlFor="email"
              className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-800 z-10">
                <Mail className="w-5 h-5" />
              </span>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loginMutation.isPending}
                className={`pl-10 py-3 text-base transition-all duration-300 focus:border-[#fbbf24] focus:ring-[#fbbf24]/30 focus:ring-2 hover:border-[#fbbf24]/60 relative z-0 ${
                  isDarkMode
                    ? "bg-gray-700/80 border-gray-600/60 text-white placeholder-gray-400 focus:bg-gray-600/80"
                    : "bg-white border-gray-300/60 text-gray-900 placeholder-gray-500 focus:bg-white"
                }`}
                shape="boxy"
                placeholder="Enter your email address"
                autoComplete="username"
              />
            </div>
          </div>
          <div
            className={`mt-4 transition-all duration-500 delay-100 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <Label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Password
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-800 z-10">
                <Lock className="w-5 h-5" />
              </span>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loginMutation.isPending}
                className={`pl-10 pr-10 py-3 text-base transition-all duration-300 focus:border-[#fbbf24] focus:ring-[#fbbf24]/30 focus:ring-2 hover:border-[#fbbf24]/60 relative z-0 ${
                  isDarkMode
                    ? "bg-gray-700/80 border-gray-600/60 text-white placeholder-gray-400 focus:bg-gray-600/80"
                    : "bg-white border-gray-300/60 text-gray-900 placeholder-gray-500 focus:bg-white"
                }`}
                shape="boxy"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 flex items-center justify-center w-10 bg-transparent border-none outline-none focus:outline-none transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-500 hover:text-[#fbbf24]"
                    : "text-gray-400 hover:text-[#f59e0b]"
                }`}
                disabled={loginMutation.isPending}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Remember Me Checkbox */}
            <div className="flex items-center mt-3">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`w-4 h-4 rounded border-2 transition-all duration-200 focus:ring-2 focus:ring-[#fbbf24]/30 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-[#fbbf24] focus:bg-gray-600"
                    : "bg-gray-50 border-gray-300 text-[#f59e0b] focus:bg-white"
                }`}
              />
              <label
                htmlFor="remember-me"
                className={`ml-3 text-sm cursor-pointer transition-colors duration-300 ${
                  isDarkMode
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-600 hover:text-gray-700"
                }`}
              >
                Keep me signed in for 30 days
              </label>
            </div>
          </div>
          {/* Error Display */}
          {loginMutation.error && (
            <div
              className={`
                rounded-md p-4 mt-4 
                transition-colors duration-200
                ${
                  isDarkMode
                    ? "bg-red-900/10 border border-red-500/20"
                    : "bg-red-50 border border-red-200"
                }
                flex items-center gap-3
              `}
            >
              <svg
                className={`w-5 h-5 ${
                  isDarkMode ? "text-red-400" : "text-red-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div
                className={`text-sm font-medium ${
                  isDarkMode ? "text-red-400" : "text-red-700"
                }`}
              >
                {getErrorMessage()}
              </div>
            </div>
          )}
          {/* Submit Button with Loading State */}
          <div
            className={`transition-all duration-500 delay-200 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <Button
              type="button"
              disabled={loginMutation.isPending}
              onClick={handleSubmit}
              className={`w-full mt-3 text-base h-12 text-white border-0 shadow-lg transition-all duration-300 font-semibold tracking-wide disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${
                loginSuccess
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:from-[#f59e0b] hover:to-[#d97706]"
              }`}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-medium">Signing you in...</span>
                </div>
              ) : loginSuccess ? (
                <span className="flex items-center justify-center gap-2 font-semibold">
                  Success! Redirecting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-semibold">
                  Sign in
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
