import {
  Clock,
  Video,
  ShieldCheck,
  ArrowRight,
  User, // Just a placeholder, actually use normal english Building2 below
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Stethoscope,
  Computer,
  Building2 as HospitalIcon,
  FileQuestion,
} from "lucide-react";

export default function DemoPage() {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-1/2">
          <div className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-teal-200 mb-6">
            <Video className="w-4 h-4" /> 1-on-1 Guided Demo
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight leading-tight">
            See Your Clinic's Future <br />{" "}
            <span className="text-teal-700">In Real-Time</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed max-w-xl">
            Schedule a personalized walkthrough with a Nepali healthcare systems
            architect. We'll show you exactly how Procare Software will
            eliminate your unique administrative bottlenecks and upgrade patient
            care.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" /> 30-45 Minute Session
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Free & No
              Obligation
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 relative group">
          <div className="absolute inset-0 bg-teal-100 rounded-xl transform rotate-2 group-hover:rotate-3 transition-transform duration-500 border border-teal-200" />
          <div className="p-2 bg-white border border-slate-200 rounded-xl relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
            <img
              alt="Healthcare software demo visualization"
              className="rounded-lg border border-slate-100 w-full h-auto object-cover aspect-[4/3]"
              src="/images/demo_booking_hero.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?auto=format&fit=crop&w=1000&q=80";
              }}
            />
          </div>
        </div>
      </section>

      {/* Booking Form & Expectation Section */}
      <section className="py-24 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Main Booking Form */}
          <div className="lg:col-span-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 md:p-10 clarity-card">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Request Your Session
                </h2>
                <p className="text-slate-600 text-sm">
                  Fill in your details, and our local implementation team will
                  coordinate a time that suits your clinic's schedule.
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Fields */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" /> First Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="w-full h-11 px-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                      placeholder="e.g. Ramesh"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="w-full h-11 px-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                      placeholder="e.g. Sharma"
                      type="text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Fields */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" /> Email Address{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="w-full h-11 px-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                      placeholder="ramesh@clinic.com.np"
                      type="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" /> Phone Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="w-full h-11 px-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                      placeholder="+977 98XXXXXXXX"
                      type="tel"
                    />
                  </div>
                </div>

                {/* Clinic Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <HospitalIcon className="w-4 h-4 text-slate-400" /> Clinic /
                    Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full h-11 px-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                    placeholder="Enter official medical facility name"
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dropdowns */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Your Professional Role{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        className="w-full h-11 pl-3 pr-10 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 appearance-none transition-colors"
                      >
                        <option disabled selected value="">
                          Select your role...
                        </option>
                        <option value="doctor">
                          Medical Doctor / Physician
                        </option>
                        <option value="manager">
                          Practice / Clinic Manager
                        </option>
                        <option value="admin">Hospital Administrator</option>
                        <option value="owner">Clinic Owner / Director</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="other">
                          Other Healthcare Professional
                        </option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 9l-7 7-7-7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Primary Software Interest{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        className="w-full h-11 pl-3 pr-10 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 appearance-none transition-colors"
                      >
                        <option disabled selected value="">
                          Select main interest...
                        </option>
                        <option value="all">Complete System End-to-End</option>
                        <option value="emr">
                          Digital Patient Records (EMR/EHR)
                        </option>
                        <option value="appointments">
                          Smart Appointment Scheduling
                        </option>
                        <option value="pharmacy">
                          Pharmacy & Inventory Ledger
                        </option>
                        <option value="billing">
                          Automated Billing & Accounts
                        </option>
                        <option value="other">
                          Specific Integration Requirements
                        </option>
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 9l-7 7-7-7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Challenges Textarea */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-slate-400" /> Key
                    Bottlenecks / Challenges (Optional)
                  </label>
                  <textarea
                    className="w-full p-3 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors min-h-[100px] resize-y"
                    placeholder="Briefly describe what issues you are trying to solve (e.g. slow patient intake, untracked medicine expiry, complex commission splitting...)"
                  />
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    className="w-full sm:w-auto bg-teal-700 hover:bg-teal-600 text-white font-bold h-12 px-10 rounded text-sm uppercase tracking-wider transition-colors border-2 border-transparent focus:outline-none focus:border-teal-300 flex items-center justify-center gap-2 mx-auto sm:mx-0"
                    type="submit"
                  >
                    Finalize Demo Request
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-slate-500 mt-4 text-center sm:text-left">
                    By submitting, you agree to Procare's diagnostic review
                    process. We guard your data fiercely under local privacy
                    guidelines.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* What to expect */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 clarity-card">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center">
                  <Video className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  What To Expect
                </h3>
              </div>

              <ul className="space-y-4">
                {[
                  "Detailed requirements gathering call.",
                  "Personalized Nepal-specific workflow configuration showcase.",
                  "Q&A session with system deployment engineers.",
                  "Transparent hardware integration limits discussion.",
                  "Clear, straightforward cost analysis tailored to your size.",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm text-slate-600 font-medium leading-relaxed"
                  >
                    <CheckCircle2 className="w-5 h-5 text-health-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Common FAQ */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 clarity-card">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Quick FAQ</h3>
              </div>

              <div className="space-y-5 text-sm">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    Do I need technical knowledge?
                  </h4>
                  <p className="text-slate-600">
                    No. We demonstrate the system assuming standard computer
                    literacy. It's built to be intuitive.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    Is this an automated recording?
                  </h4>
                  <p className="text-slate-600">
                    No. You speak directly with a live Nepalese software
                    engineer/specialist who will drive the screen for you.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    Can I invite my staff?
                  </h4>
                  <p className="text-slate-600">
                    Absolutely. We encourage having doctors, receptionists, and
                    owners on the same demo evaluation call.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Contact Block */}
            <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 text-center">
              <h3 className="font-bold text-white mb-2">
                Need Immediate Triage?
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Skip the form and contact deployment specialists directly.
              </p>

              <div className="space-y-3 text-sm font-medium text-slate-200">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4 text-teal-500" /> +977 986-0577865
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 text-teal-500" />{" "}
                  procarenepal@gmail.com
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals End */}
      <section className="py-24 bg-slate-50 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">
            Why Hundreds of Nepali Clinics Chose Us After Their Demo
          </h2>
          <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
            Our platform isn't just theory. See precisely why local institutions
            abandon legacy systems and paper records immediately after a
            platform walk-through.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              {
                title: "NMC Validated Data",
                description:
                  "Built-in checks for NMC licensing limits, native BS Dates, and government-standard reporting exports.",
                icon: <ShieldCheck className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Zero Layout Confusion",
                description:
                  "Clean, flat UI prevents clerk fatigue. Navigation paths are aggressively optimized for one-click access.",
                icon: <Computer className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Pharmacy Loop Closure",
                description:
                  "Prescriptions automatically decrement physical local pharmacy inventory logic. No double-entry required.",
                icon: <Stethoscope className="w-6 h-6 text-teal-700" />,
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-6 border border-slate-200 rounded-md clarity-card"
              >
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
