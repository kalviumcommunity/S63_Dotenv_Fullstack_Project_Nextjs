"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [bubblePositions, setBubblePositions] = useState<Array<{ left: string; top: string }>>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch("email");
  const password = watch("password");

  useEffect(() => {
    setIsMounted(true);
    // Generate bubble positions only on client side to avoid hydration mismatch
    setBubblePositions(
      Array.from({ length: 25 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }))
    );
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || "Login failed");
        return;
      }

      if (json.success && json.data?.token && json.data?.user) {
        login(json.data.token, json.data.user);
        router.push("/dashboard");
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailValidationState = () => {
    if (!email) return "idle";
    if (errors.email) return "error";
    if (email.includes("@") && email.includes(".")) return "valid";
    return "typing";
  };

  const getPasswordValidationState = () => {
    if (!password) return "idle";
    if (errors.password) return "error";
    if (password.length >= 6) return "valid";
    return "typing";
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 p-4">
      {/* Animated Water Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 opacity-20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-300 to-cyan-300 opacity-10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Water Wave Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="rgba(59, 130, 246, 0.1)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-water-wave-bottom"
          />
        </svg>
      </div>

      {/* Floating Bubbles - Only render after mount to avoid hydration mismatch */}
      {isMounted &&
        bubblePositions.map((pos, i) => {
          const baseDelay = i * 0.3;
          const baseDuration = 4 + (i % 3);
          return (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-400/20"
              style={{
                left: pos.left,
                top: pos.top,
                width: `${8 + (i % 4) * 4}px`,
                height: `${8 + (i % 4) * 4}px`,
                animationName: "bubble-float-continuous",
                animationDuration: `${baseDuration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${baseDelay}s`,
              }}
            />
          );
        })}

      {/* 3D Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-md"
        style={{
          transform: `perspective(1000px) rotateY(${(mousePosition.x - 200) / 20}deg) rotateX(${-(mousePosition.y - 300) / 20}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="relative rounded-3xl border border-white/30 bg-white/20 backdrop-blur-2xl p-8 shadow-2xl"
          style={{
            boxShadow: `
              0 25px 70px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.7),
              0 0 0 1px rgba(255, 255, 255, 0.2)
            `,
          }}
        >
          {/* Glow Effect */}
          <div
            className="absolute inset-0 rounded-3xl opacity-50"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.3), transparent 50%)`,
            }}
          />

          <div className="relative z-10">
            {/* CivicTrack Logo - Clickable to Homepage */}
            <Link
              href="/"
              className="group mb-8 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <div className="relative">
                <span className="relative z-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 px-3 py-1.5 text-white text-lg font-bold shadow-lg transition-all group-hover:shadow-cyan-500/50">
                  CT
                </span>
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              </div>
              <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent transition-all group-hover:from-cyan-700 group-hover:to-teal-700">
                CivicTrack
              </span>
            </Link>

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600">Sign in to continue to CivicTrack</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="animate-shake rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    {...register("email")}
                    autoComplete="email"
                    className={`w-full rounded-xl border-2 bg-white/60 px-4 py-3.5 pl-12 pr-4 text-gray-900 backdrop-blur-sm transition-all duration-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      errors.email ? "border-red-500" : getEmailValidationState() === "valid" ? "border-green-500" : "border-gray-200"
                    }`}
                    placeholder="you@example.com"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className={`h-5 w-5 transition-colors ${errors.email ? "text-red-500" : getEmailValidationState() === "valid" ? "text-green-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  {getEmailValidationState() === "valid" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-fade-in">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="animate-slide-down text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    {...register("password")}
                    autoComplete="current-password"
                    className={`w-full rounded-xl border-2 bg-white/60 px-4 py-3.5 pl-12 pr-4 text-gray-900 backdrop-blur-sm transition-all duration-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      errors.password ? "border-red-500" : getPasswordValidationState() === "valid" ? "border-green-500" : "border-gray-200"
                    }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className={`h-5 w-5 transition-colors ${errors.password ? "text-red-500" : getPasswordValidationState() === "valid" ? "text-green-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  {getPasswordValidationState() === "valid" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-fade-in">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.password && (
                  <p className="animate-slide-down text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-[2px] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
              >
                <div className="relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-white transition-all duration-300 group-hover:from-blue-700 group-hover:to-cyan-700">
                  {isLoading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </div>
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bubble-float-continuous {
          0% { transform: translateY(100vh) translateX(0) scale(0); opacity: 0; }
          10% { opacity: 0.3; }
          50% { transform: translateY(50vh) translateX(50px) scale(1); opacity: 0.5; }
          100% { transform: translateY(-10vh) translateX(100px) scale(0.5); opacity: 0; }
        }
        @keyframes water-wave-bottom {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-25px) translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-water-wave-bottom { 
          animation-name: water-wave-bottom;
          animation-duration: 4s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
