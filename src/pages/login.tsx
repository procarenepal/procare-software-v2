import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  MapPin,
  Headphones,
  AlertTriangle,
} from "lucide-react";
import { FirebaseError } from "firebase/app";
import { setPersistence, browserLocalPersistence } from "firebase/auth";

import { useAuthContext } from "@/context/AuthContext";
import { auth } from "@/config/firebase";
import { clinicService } from "@/services/clinicService";
import { userService } from "@/services/userService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, currentUser, userData } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for error messages in location state
  useEffect(() => {
    if (location.state?.error) {
      setErrorMessage(location.state.error);
    }

    // Check for subscription-related redirects
    const urlParams = new URLSearchParams(location.search);
    const reason = urlParams.get("reason");

    if (reason === "subscription") {
      setErrorMessage(
        "Your session was terminated due to subscription changes. Please contact your administrator for more information.",
      );
    }
  }, [location]);

  // Get the redirect URL from location state or determine based on user role
  const getRedirectUrl = () => {
    // If a specific path was requested, go there first
    if (location.state?.from?.pathname) {
      return location.state.from.pathname;
    }

    // Otherwise, route based on role
    if (userData) {
      if (userData.role === "super-admin") {
        return "/admin";
      } else if (userData.role === "clinic-admin") {
        return "/dashboard";
      } else {
        return "/dashboard";
      }
    }

    // Default fallback
    return "/dashboard";
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser && userData) {
      navigate(getRedirectUrl());
    }
  }, [currentUser, userData, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // Set persistence based on remember me checkbox
      const persistenceType = browserLocalPersistence;

      await setPersistence(auth, persistenceType);

      // Now sign in
      await login(email, password);

      // Get current user data to check clinic subscription
      const currentAuthUser = auth.currentUser;

      if (currentAuthUser) {
        const currentUserData = await userService.getUserById(
          currentAuthUser.uid,
        );

        // Check clinic subscription status for non-super-admin users
        if (
          currentUserData &&
          currentUserData.role !== "super-admin" &&
          currentUserData.clinicId
        ) {
          const clinic = await clinicService.getClinicById(
            currentUserData.clinicId,
          );

          if (clinic) {
            // Check if subscription is suspended, cancelled, or expired
            const isSubscriptionSuspended =
              clinic.subscriptionStatus === "suspended";
            const isSubscriptionCancelled =
              clinic.subscriptionStatus === "cancelled";
            const isSubscriptionExpired =
              clinic.subscriptionEndDate &&
              new Date(clinic.subscriptionEndDate) < new Date();

            if (isSubscriptionSuspended) {
              await auth.signOut();
              setErrorMessage(
                "Your clinic's subscription has been suspended. Please contact your administrator or support team to reactivate your account.",
              );
              setLoading(false);

              return;
            }

            if (isSubscriptionCancelled) {
              await auth.signOut();
              setErrorMessage(
                "Your clinic's subscription has been cancelled. Please contact your administrator or support team to reactivate your account.",
              );
              setLoading(false);

              return;
            }

            if (isSubscriptionExpired) {
              await auth.signOut();
              setErrorMessage(
                "Your clinic's subscription has expired. Please contact your administrator or support team to renew your subscription.",
              );
              setLoading(false);

              return;
            }
          }
        }
      }

      // Authentication successful - redirect will happen via the useEffect above once userData is loaded
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/invalid-email":
            setErrorMessage("Invalid email address.");
            break;
          case "auth/user-disabled":
            setErrorMessage("This account has been disabled.");
            break;
          case "auth/user-not-found":
            setErrorMessage("No account found with this email.");
            break;
          case "auth/wrong-password":
            setErrorMessage("Incorrect password.");
            break;
          case "auth/invalid-credential":
            setErrorMessage(
              "Invalid email or password. Please check your credentials and try again.",
            );
            break;
          case "auth/too-many-requests":
            setErrorMessage(
              "Too many failed login attempts. Please try again later.",
            );
            break;
          case "auth/network-request-failed":
            setErrorMessage(
              "Network error. Please check your connection and try again.",
            );
            break;
          default:
            setErrorMessage(`Failed to log in: ${error.message}`);
        }
      } else {
        setErrorMessage("An unexpected error occurred.");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md">
        {/* Compact Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900 tracking-tight">
            Procare <span className="text-teal-700">Nepal</span>
          </h1>
          <p className="text-slate-600 font-medium">
            Authenticate to your operational dashboard
          </p>
        </div>

        {/* Custom Login Card */}
        <div className="bg-white p-8 border border-slate-200 rounded-lg clarity-card mb-6">
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block">
                Official Email
              </label>
              <input
                required
                autoComplete="email"
                className="w-full h-11 px-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                placeholder="your.name@clinic.com.np"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  className="text-xs text-teal-700 hover:text-teal-600 font-medium hover:underline underline-offset-2"
                  to="/forgot-password"
                >
                  Reset password?
                </Link>
              </div>
              <div className="relative">
                <input
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-3 pr-10 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  placeholder="••••••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 mt-2">
              <input
                checked={rememberMe}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                id="rememberMe"
                type="checkbox"
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label
                className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                htmlFor="rememberMe"
              >
                Maintain active session
              </label>
            </div>

            {/* Error Message Render */}
            {errorMessage && (
              <div
                className={`p-4 text-sm rounded border ${
                  errorMessage.includes("subscription")
                    ? "text-orange-800 bg-orange-50 border-orange-200"
                    : "text-red-800 bg-red-50 border-red-200"
                }`}
              >
                {errorMessage.includes("subscription") && (
                  <div className="flex items-center gap-1.5 mb-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Subscription Alert</span>
                  </div>
                )}
                <span className="leading-relaxed font-medium">
                  {errorMessage}
                </span>
                {errorMessage.includes("subscription") && (
                  <div className="mt-2 text-xs text-orange-700 border-t border-orange-200/50 pt-2 font-medium">
                    Please contact our central billing team immediately at{" "}
                    <a
                      className="font-bold underline hover:text-orange-900"
                      href="mailto:procarenepal@gmail.com"
                    >
                      procarenepal@gmail.com
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              className={`w-full mt-2 bg-teal-700 text-white font-bold h-11 rounded text-sm tracking-wide transition-colors border-2 border-transparent focus:outline-none flex items-center justify-center ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-teal-600"}`}
              disabled={loading}
              type="submit"
            >
              {loading ? "Authenticating..." : "Initialize Session"}
            </button>

            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600 font-medium">
                Not utilizing Procare Software yet?{" "}
                <Link
                  className="text-teal-700 hover:text-teal-600 font-bold hover:underline underline-offset-2"
                  to="/contact"
                >
                  Contact Sales
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Minimal Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> High Security
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Made for Nepal
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" /> 24/7 Monitored
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Protected by stringent medical privacy protocols.{" "}
            <Link
              className="text-slate-500 hover:text-teal-700 hover:underline"
              to="/privacy"
            >
              Privacy Standard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
