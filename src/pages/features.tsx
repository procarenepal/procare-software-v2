import { Link } from "react-router-dom";
import {
  Users,
  Settings,
  Server,
  Calendar,
  ShieldCheck,
  ClipboardList,
  FileText,
  Building,
  Computer,
  Stethoscope,
  Pill,
  CreditCard,
  FileClock,
  LayoutDashboard,
  ShieldAlert,
  Archive,
  BookOpen,
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex justify-center items-center">
          {/* Abstract shapes or a very subtle image could go here */}
          <div className="w-[800px] h-[400px] bg-teal-500 rounded-full blur-[120px] mix-blend-multiply" />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-teal-200 mb-6">
            <Settings className="w-4 h-4" /> Comprehensive Management
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 tracking-tight leading-tight">
            Complete Healthcare <br />{" "}
            <span className="text-teal-700">Digital Infrastructure</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
            Discover how Procare Software transforms medical practice management
            with an extensive suite of digital tools engineered from the ground
            up for Nepal's clinical environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              className="bg-teal-700 text-white font-medium px-8 py-3.5 text-sm hover:bg-teal-600 transition-colors rounded border border-teal-800 focus:outline-none"
              to="/demo"
            >
              Book Specialized Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Patient Management Features */}
      <section className="py-20 bg-white border-y border-slate-200 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide border border-slate-200 mb-4">
              <Users className="w-5 h-5 text-slate-600" />
              Patient Care Hub
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Absolute Patient Management
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Maintain meticulously organized, accessible, and comprehensive
              patient records designed specifically to support Nepali
              demographic nuances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "In-Depth Registration",
                description:
                  "Capture extensive patient demographics, including full BS/AD date support, emergency contacts, local addresses, and immediate familial links.",
                icon: <ClipboardList className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Medical Histories",
                description:
                  "Secure, chronological tracking of a patient's entire medical background. Easily jump between past diagnoses, procedures, and long-term treatment strategies.",
                icon: <Archive className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Structured Medical Notes",
                description:
                  "Provide doctors with logical, multi-sectional note formats. Standardized templates ensure consistency in symptom tracking and care directives.",
                icon: <FileText className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Synchronized Billing",
                description:
                  "All financial interactions directly tied to patient profiles. Seamlessly generate NPR invoices and track outstanding balances over the patient lifecycle.",
                icon: <CreditCard className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Appointment Timelines",
                description:
                  "Instantly view all historical visits and upcoming scheduled appointments associated with an individual's digital health record.",
                icon: <FileClock className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "NMC Validation Ready",
                description:
                  "Structure data to conform with governmental standards. Easily retrieve and export demographic summaries for mandatory compliance reporting.",
                icon: <ShieldCheck className="w-6 h-6 text-teal-700" />,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-slate-50 border border-slate-200 rounded-md clarity-card hover:border-teal-400 hover:bg-white transition-all group"
              >
                <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center border border-slate-200 mb-5 group-hover:scale-110 transition-transform shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">
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

      {/* Appointment Engine */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide border border-teal-200 mb-4">
              <Calendar className="w-5 h-5 text-teal-700" />
              Operational Scheduling
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              A Powerhouse Appointment Engine
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Prevent overbooking and minimize wait times. Intelligent
              scheduling guarantees maximum throughout without burning out your
              medical staff.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                {
                  title: "Dynamic Appointment Rules",
                  description:
                    "Configure new consultations, follow-ups, and urgent triage setups. Attach distinct billing rules and buffer times automatically.",
                },
                {
                  title: "Live Doctor Availability",
                  description:
                    "Calendar interfaces update in real-time, preventing double bookings. Receptionists can spot gaps and optimize the daily flow instantly.",
                },
                {
                  title: "Zero No-Show Optimization",
                  description:
                    "Categorize appointment statuses dynamically. Track when patients arrive, are waiting, or if they skip—helping you blacklist chronic offenders.",
                },
                {
                  title: "Automated Rescheduling",
                  description:
                    "Doctor suddenly unavailable? Quickly bulk-reschedule a block of patients with automated notifications dispatched to their profiles.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 border border-slate-200 bg-white rounded-md clarity-card"
                >
                  <div className="w-2 h-2 mt-2 rounded bg-teal-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative p-2 bg-white border border-slate-200 rounded-lg">
              <div className="absolute inset-0 bg-teal-600 transform translate-x-2 translate-y-2 rounded-lg -z-10 opacity-10" />
              <img
                alt="Clinic Scheduling Interface Preview"
                className="rounded border border-slate-100 w-full h-auto object-cover aspect-[4/3]"
                src="/images/banner_features.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=800&q=80";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Pharmacy & Inventory */}
      <section className="py-20 bg-white border-y border-slate-200 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide border border-slate-200 mb-4">
              <Pill className="w-5 h-5 text-slate-600" />
              Dispensary Control
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Clinical Pharmacy & Inventory
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Don't lose revenue tracking stock on paper. Our rigorous inventory
              ledger connects direct clinical prescriptions to physical
              dispensary reductions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              {
                title: "Deep Cataloging",
                description:
                  "Index pharmacological items by generic names, specific brand configurations, and rigid categories.",
                icon: <BookOpen className="w-8 h-8 text-teal-700" />,
              },
              {
                title: "Active Stock Balancing",
                description:
                  "Monitor stock minimums. Automated triggers engage before crucial medications hit dangerously low levels.",
                icon: <LayoutDashboard className="w-8 h-8 text-teal-700" />,
              },
              {
                title: "Purchase Pipeline",
                description:
                  "End-to-end integration mapping suppliers, recording inward goods, and logging wholesale invoices natively.",
                icon: <Computer className="w-8 h-8 text-teal-700" />,
              },
              {
                title: "Expiry Deterrence",
                description:
                  "Batch-level tracking isolates approaching expiration dates, ensuring FIFO operational safety for your pharmacy.",
                icon: <ShieldAlert className="w-8 h-8 text-teal-700" />,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-slate-50 border border-slate-200 rounded-md clarity-card hover:border-teal-500 transition-colors flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-200">
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

      {/* Enterprise Capabilities */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Building className="w-6 h-6 text-slate-800" />
              <h3 className="text-2xl font-bold text-slate-900">
                Multi-Facility Administration
              </h3>
            </div>
            <p className="text-slate-600 mb-8 leading-relaxed">
              For expanding healthcare groups, standard solutions don't scale.
              Procare allows you to anchor a primary headquarters while spinning
              up distinct regional branches, all isolated yet centrally
              monitored.
            </p>
            <ul className="space-y-4">
              {[
                "Independent Operating Hours & Tax Identifiers",
                "Strict Data Partitioning Between Branches",
                "Central Administrative Dashboard Control",
                "Cross-Clinic Staff Reassignments",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-slate-700 font-medium"
                >
                  <div className="mt-1">
                    <Server className="w-4 h-4 text-teal-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Stethoscope className="w-6 h-6 text-slate-800" />
              <h3 className="text-2xl font-bold text-slate-900">
                Staff & Physician Mastery
              </h3>
            </div>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Handle complex employment parameters effortlessly. Distinguish
              between permanent organizational doctors and visiting specialists
              by structuring flexible commission paradigms securely.
            </p>
            <ul className="space-y-4">
              {[
                "Detailed Doctor Profiles with NMC Tracking",
                "Advanced Visit & Commission Algorithms",
                "Granular Role-Based Data Access (RBAC)",
                "Full System Activity Audit Logs",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-slate-700 font-medium"
                >
                  <div className="mt-1">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-teal-800 border-y border-teal-900 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl font-bold mb-6 text-white tracking-tight">
            Deploy Powerful Software Today
          </h2>
          <p className="text-teal-100 text-lg mb-10 max-w-2xl font-medium leading-relaxed">
            Eliminate clerical friction and elevate patient focus. Our system is
            robust, meticulously styled for low visual strain, and engineered
            relentlessly for velocity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              className="bg-white text-teal-900 font-bold px-10 py-4 text-sm uppercase tracking-wider hover:bg-slate-100 transition-colors rounded border-2 border-transparent w-full sm:w-auto"
              to="/demo"
            >
              Initialize Demo Deployment
            </Link>
            <Link
              className="bg-teal-700 text-white font-bold px-10 py-4 text-sm uppercase tracking-wider hover:bg-teal-600 transition-colors rounded border-2 border-teal-600 w-full sm:w-auto"
              to="/contact"
            >
              Direct Integration Consult
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
