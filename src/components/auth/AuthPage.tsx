import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";

interface AuthPageProps {
  initialMode?: "login" | "signup";
  onBackToHome?: () => void;
}

export function AuthPage({ initialMode = "login", onBackToHome }: AuthPageProps) {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Sync mode if initialMode changes from parent
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setInfo(null);
  }, [initialMode]);

  const switchMode = (newMode: "login" | "signup") => {
    if (newMode === mode) return;
    setMode(newMode);
    setError(null);
    setInfo(null);
    setPassword("");
    setConfirmPassword("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    // Client-side confirmation check for signup
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter both passwords.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setBusy(true);
    setError(null);
    setInfo(null);

    try {
      const result =
        mode === "login"
          ? await signIn(email, password)
          : await signUp(email, password);

      if (result.error) {
        setError(result.error);
      } else if (result.needsEmailConfirmation) {
        setInfo(
          "Shop account registered! Please check your email inbox to confirm your account, then sign in below."
        );
        setMode("login");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between selection:bg-[#0069FF] selection:text-white font-sans antialiased">
      {/* Top Header Navigation */}
      <header className="max-w-6xl w-full mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between">
        {onBackToHome ? (
          <button
            type="button"
            onClick={onBackToHome}
            className="group inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-950 transition-colors py-2 px-3 rounded-full hover:bg-stone-200/50 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Home & Workflows</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
              Autonomous Commerce Hub
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="w-full max-w-lg mx-auto px-6 py-10 sm:py-14">
        <div className="bg-white rounded-[32px] border border-stone-200/80 p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all">
          {/* Brand & Editorial Title */}
          <div className="text-center mb-8">
            <span className="text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#0069FF] inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#0069FF]" />
              Merchant Sanctuary
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mt-2.5">
              {mode === "login" ? "Welcome Back" : "Create Your Shop"}
            </h1>
            <p className="text-stone-500 text-sm mt-2 font-normal">
              {mode === "login"
                ? "Sign in to manage your orders, slips, and AI sales agent."
                : "Launch automated social commerce workflows for Myanmar."}
            </p>
          </div>

          {/* Mode Switcher Segmented Pills */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="grid grid-cols-2 p-1.5 bg-[#F3EFEA] rounded-2xl mb-8 border border-stone-200/60"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => switchMode("login")}
              className={`py-2.5 text-xs font-semibold tracking-wide rounded-xl transition-all duration-200 cursor-pointer text-center ${
                mode === "login"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => switchMode("signup")}
              className={`py-2.5 text-xs font-semibold tracking-wide rounded-xl transition-all duration-200 cursor-pointer text-center ${
                mode === "signup"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Banners */}
          {info && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{info}</p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-stone-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="merchant@shop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-[#FAF8F5]/60 border border-stone-200 pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-stone-700"
                >
                  Password
                </label>
                {mode === "login" && (
                  <span className="text-[11px] text-stone-400 font-normal">
                    Min. 6 characters
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-[#FAF8F5]/60 border border-stone-200 pl-10 pr-11 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-medium text-stone-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl bg-[#FAF8F5]/60 border border-stone-200 pl-10 pr-11 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-3.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase text-white bg-[#0069FF] hover:bg-[#0052CC] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              {busy
                ? "Processing..."
                : mode === "login"
                ? "Sign In to Dashboard"
                : "Create Merchant Account"}
            </button>
          </form>

          {/* Footer Assistance */}
          <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              End-to-End Encrypted
            </span>

            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="text-stone-700 hover:text-[#0069FF] font-medium transition cursor-pointer"
            >
              {mode === "login"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="text-center py-6 text-stone-400 text-xs">
        <p>© 2026 Sales Brain AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
