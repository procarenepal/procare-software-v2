import { useState } from "react";
import { Link } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

import { passwordService } from "@/services/passwordService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      await passwordService.sendPasswordResetEmail(email);
      setIsSubmitted(true);
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/invalid-email":
            setErrorMessage("Invalid email address format.");
            break;
          case "auth/user-not-found":
            setErrorMessage("No active account found with this email address.");
            break;
          case "auth/too-many-requests":
            setErrorMessage(
              "Too many requests originating from this device. Please pause and try again later.",
            );
            break;
          case "auth/network-request-failed":
            setErrorMessage(
              "Network connection failed. Please verify your internet and retry.",
            );
            break;
          default:
            setErrorMessage(
              `Failed to dispatch reset instructions: ${error.message}`,
            );
        }
      } else {
        setErrorMessage("An unexpected systemic error occurred.");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900 tracking-tight">
            Account <span className="text-teal-700">Recovery</span>
          </h1>
          <p className="text-slate-600 font-medium">
            Verify your identity to reset password
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white p-8 border border-slate-200 rounded-lg clarity-card mb-6">
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block text-left">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    required
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors disabled:opacity-50 disabled:bg-slate-50"
                    disabled={loading}
                    placeholder="doctor@clinic.com.np"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Error Render */}
              {errorMessage && (
                <div className="p-4 text-sm rounded border text-red-800 bg-red-50 border-red-200">
                  <div className="flex items-center gap-1.5 mb-1 text-red-700 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>System Notice</span>
                  </div>
                  <span className="font-medium leading-relaxed">
                    {errorMessage}
                  </span>
                </div>
              )}

              {/* Submit Action */}
              <button
                className={`w-full bg-teal-700 text-white font-bold h-11 rounded text-sm tracking-wide transition-colors border-2 border-transparent focus:outline-none flex items-center justify-center ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-teal-600"}`}
                disabled={loading}
                type="submit"
              >
                {loading ? "Dispatching..." : "Transmit Reset Link"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 text-slate-900">
              <div className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Check Your Inbox</h3>
              <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">
                We've dispatched secure password reset instructions directly to{" "}
                <span className="font-bold text-slate-800">{email}</span>.
              </p>

              <div className="space-y-3">
                <button
                  className="w-full bg-teal-50 text-teal-800 font-bold h-11 rounded text-sm border border-teal-200 transition-colors hover:bg-teal-100 focus:outline-none"
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                    setErrorMessage("");
                  }}
                >
                  Restart Recovery Process
                </button>
                <button
                  className="w-full bg-white text-slate-600 font-semibold h-11 rounded text-sm transition-colors hover:bg-slate-50 focus:outline-none"
                  disabled={loading}
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                >
                  {loading ? "Re-dispatching..." : "Resend Link"}
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-6 mt-6 border-t border-slate-100">
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-teal-700 transition-colors"
              to="/login"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Login Segment
            </Link>
          </div>
        </div>

        {/* Support Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-6 text-left flex gap-4 items-start">
          <div className="w-10 h-10 bg-blue-100 rounded flex-shrink-0 flex items-center justify-center border border-blue-200 text-blue-700">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900 mb-1">
              Administrative Override
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              If you lack access to your registered email, contact your Clinic
              Administrator to trigger an immediate manual password reset. Or
              reach support at{" "}
              <a
                className="font-bold underline hover:text-blue-950"
                href="mailto:procarenepal@gmail.com"
              >
                procarenepal@gmail.com
              </a>
              .
            </p>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-600" /> Secured by 256-bit
          infrastructure
        </div>
      </div>
    </div>
  );
}
