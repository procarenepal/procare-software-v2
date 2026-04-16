import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Headphones,
  Building,
  Globe2,
  CheckCircle2,
} from "lucide-react";

export default function ContactPage() {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-teal-200 mb-6">
          <Headphones className="w-4 h-4" /> Priority Support
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 tracking-tight leading-tight">
          Connect With <span className="text-teal-700">Procare Nepal</span>
        </h1>

        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Whether you need urgent technical triage, subscription guidance, or
          want to deploy our system across your hospital network, our
          Kathmandu-based team is standing by.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" /> 9 AM - 6 PM (NPT)
          </div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-teal-600" /> 100% Local Resolution
          </div>
        </div>
      </section>

      {/* Primary Contact Methods */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phone */}
          <div className="bg-white p-8 border border-slate-200 rounded-lg text-center clarity-card hover:border-teal-400 transition-colors group">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
              <Phone className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Direct Phone
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Immediate triage for technical blockers or rapid deployment
              inquiries.
            </p>
            <a
              className="text-2xl font-bold text-teal-800 hover:text-teal-600 transition-colors"
              href="tel:+9779860577865"
            >
              +977 986-0577865
            </a>
          </div>

          {/* Email */}
          <div className="bg-white p-8 border border-slate-200 rounded-lg text-center clarity-card hover:border-teal-400 transition-colors group">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
              <Mail className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Email Desk
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              For detailed migration plans, custom feature requests, and
              official billing.
            </p>
            <a
              className="text-lg font-bold text-teal-800 hover:text-teal-600 transition-colors"
              href="mailto:procarenepal@gmail.com"
            >
              procarenepal@gmail.com
            </a>
          </div>

          {/* Location */}
          <div className="bg-white p-8 border border-slate-200 rounded-lg text-center clarity-card hover:border-teal-400 transition-colors group">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
              <MapPin className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              National HQ
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Schedule an in-person architectural review for large-scale clinic
              networks.
            </p>
            <p className="text-lg font-bold text-slate-800">
              Tripureshwor, Kathmandu
              <br />
              <span className="text-base font-medium text-slate-500">
                Nepal
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Auxiliary Info */}
      <section className="py-24 border-y border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              Need a Live Demonstration?
            </h3>
            <p className="text-slate-600 leading-relaxed">
              If you are evaluating Procare Software for a new medical facility
              or migrating from an older legacy system, we highly recommend
              booking a specialized 1-on-1 walk-through.
            </p>
            <Link
              className="inline-flex items-center gap-2 bg-white text-teal-800 font-bold px-6 py-3 rounded border border-teal-200 hover:bg-teal-50 hover:border-teal-300 transition-colors focus:outline-none"
              to="/demo"
            >
              <Building className="w-5 h-5" /> Initialize Demo Setup
            </Link>
          </div>

          <div className="border-t border-slate-200 pt-8 md:border-t-0 md:border-l md:pl-12 md:pt-0">
            <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">
              Emergency Support SLA
            </h3>
            <ul className="space-y-3">
              {[
                "Critical Server Outages: Immediate Escalation via Phone",
                "Prescription / Billing Blockers: < 2 Hour Resolution",
                "Standard Feature Training: Scheduled Next Business Day",
                "Data Migration Requests: Assigned Dedicated Engineer",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-sm text-slate-700 font-medium leading-relaxed"
                >
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Terminal CTA */}
      <section className="py-20 bg-teal-800 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-white tracking-tight">
            Stop Fighting Your Medical Software
          </h2>
          <p className="text-teal-100 text-lg mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Reach out to our domestic team today. We build tools that get out of
            the doctor's way, allowing your clinic to focus entirely on patient
            velocity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              className="bg-white text-teal-900 font-bold px-8 py-4 text-sm uppercase tracking-wider hover:bg-slate-100 transition-colors rounded border-2 border-transparent w-full sm:w-auto"
              href="tel:+9779860577865"
            >
              Call Headquarters
            </a>
            <a
              className="bg-teal-700 text-white font-bold px-8 py-4 text-sm uppercase tracking-wider hover:bg-teal-600 transition-colors rounded border-2 border-teal-600 w-full sm:w-auto"
              href="mailto:procarenepal@gmail.com"
            >
              Draft Email Inquiry
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
