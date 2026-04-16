import { Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  Users,
  Calendar,
  ClipboardList,
  Stethoscope,
  Pill,
  Building,
} from "lucide-react";

import { Carousel } from "@/components/ui/Carousel";

export default function IndexPage() {
  const testimonials = [
    <div className="p-8 text-center bg-white border border-slate-200 rounded-md clarity-card h-full flex flex-col justify-center items-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full mb-4 flex items-center justify-center border border-slate-200 text-xl overflow-hidden">
        <img
          alt="Dr"
          className="w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
        />
      </div>
      <p className="text-lg italic text-slate-700 mb-6">
        "Procare Software transformed our clinic completely. You'll notice the
        difference on day one - we reduced paperwork by 80% and our patients
        love the digital prescriptions."
      </p>
      <h4 className="font-bold text-slate-900">Dr. Rajesh Shrestha</h4>
      <p className="text-sm text-slate-500">
        Medical Director, Shrestha Medical Center
      </p>
    </div>,
    <div className="p-8 text-center bg-white border border-slate-200 rounded-md clarity-card h-full flex flex-col justify-center items-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full mb-4 flex items-center justify-center border border-slate-200 text-xl overflow-hidden">
        <img
          alt="Manager"
          className="w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
        />
      </div>
      <p className="text-lg italic text-slate-700 mb-6">
        "Your staff will appreciate the appointment system. It revolutionized
        how we manage our schedule. SMS reminders in Nepali work perfectly,
        keeping our patients informed."
      </p>
      <h4 className="font-bold text-slate-900">Sita Gurung</h4>
      <p className="text-sm text-slate-500">
        Practice Manager, Pokhara Valley Hospital
      </p>
    </div>,
  ];

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 px-4 py-16 lg:py-24 max-w-7xl mx-auto">
        <div className="flex-1 text-center lg:text-left max-w-2xl">
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
            <span className="flex items-center gap-1.5 bg-teal-100 text-teal-800 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-teal-200">
              <MapPin className="w-4 h-4" /> Built for Nepal
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-slate-200">
              <Building2 className="w-4 h-4" /> Trusted by 100+ Clinics
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl lg:leading-[1.15] font-bold mb-6 text-slate-900 tracking-tight">
            Transform <span className="text-teal-700">Your Practice</span> With
            Modern Healthcare Technology
          </h1>

          <p className="mb-8 text-lg lg:text-xl text-slate-600 leading-relaxed font-medium">
            Your patients deserve a seamless experience. Bring your clinic into
            the future with intelligent digital records, automated appointments,
            and comprehensive pharmacy management. Take absolute control of your
            workflow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
            <Link
              className="bg-teal-700 text-white font-medium px-8 py-3.5 text-sm hover:bg-teal-600 transition-colors rounded border border-teal-800 text-center inline-block"
              to="/demo"
            >
              Book Your 1-to-1 Demo
            </Link>
            <Link
              className="bg-white text-slate-700 font-medium px-8 py-3.5 text-sm hover:bg-slate-50 transition-colors rounded border border-slate-300 text-center inline-block"
              to="/contact"
            >
              Explore Features
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Gov. Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span>Local Support</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full lg:w-auto relative group">
          <div className="absolute inset-0 bg-teal-100 rounded-xl transform rotate-2 group-hover:rotate-3 transition-transform duration-500 border border-teal-200" />
          <div className="clarity-card p-3 bg-white border border-slate-200 rounded-xl relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
            <div className="rounded-lg border border-slate-100 overflow-hidden bg-slate-50">
              <img
                alt="Doctor using modern dashboard"
                className="w-full h-auto object-cover"
                src="/images/hero_doctor_dashboard.png"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { number: "100+", label: "Active Facilities" },
            { number: "500+", label: "Medical Professionals" },
            { number: "30k+", label: "Patient Records" },
            { number: "99.9%", label: "System Uptime" },
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-4 ${index !== 3 ? "lg:border-r border-slate-100" : ""}`}
            >
              <p className="text-3xl font-bold text-teal-700 mb-1">
                {stat.number}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            Everything You Need to Run Your Practice
          </h2>
          <p className="text-lg text-slate-600">
            From patient registration to complex billing, our platform gives you
            the tools to manage every aspect of your clinic through one clean,
            unified interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Patient Management",
              description:
                "Give your patients a smooth registration process. Track complete medical history, billing records, and multi-tab patient profiles with Nepali BS date support.",
              icon: <Users className="w-5 h-5 text-slate-700" />,
            },
            {
              title: "Advanced Appointments",
              description:
                "You're in control of your schedule. Define custom appointment types, pricing, and instantly track initial visits, follow-ups, and emergencies.",
              icon: <Calendar className="w-5 h-5 text-slate-700" />,
            },
            {
              title: "Digital Records",
              description:
                "Your digital filing cabinet. Securely upload X-rays, manage customizable medical reports, and structure patient notes perfectly.",
              icon: <ClipboardList className="w-5 h-5 text-slate-700" />,
            },
            {
              title: "Staff & Doctors",
              description:
                "Empower your team. Manage comprehensive profiles with NMC license tracking, calculate commissions instantly, and maintain strict access control.",
              icon: <Stethoscope className="w-5 h-5 text-slate-700" />,
            },
            {
              title: "Pharmacy Control",
              description:
                "Never run out of essential stock. Automate inventory alerts, manage expiry dates, and streamline purchase orders with ease.",
              icon: <Pill className="w-5 h-5 text-slate-700" />,
            },
            {
              title: "Multi-Branch Management",
              description:
                "Expand your operations seamlessly. Centralize administration across all your clinic locations while keeping branch-specific data isolated.",
              icon: <Building className="w-5 h-5 text-slate-700" />,
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white border border-slate-200 rounded-md hover:border-teal-500 hover:bg-slate-50 transition-colors clarity-card"
            >
              <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-xl border border-slate-200 mb-5">
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
      </section>

      {/* Contextual & Tech Section */}
      <section className="py-24 bg-white border-y border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-slate-100 rounded-xl transform -rotate-2 group-hover:-rotate-3 transition-transform duration-500 border border-slate-200" />
            <div className="p-3 bg-white border border-slate-200 rounded-xl relative z-10 transition-transform duration-500 group-hover:translate-y-1">
              <div className="rounded-lg border border-slate-100 overflow-hidden bg-slate-50">
                <img
                  alt="Modern Nepali Healthcare Technology"
                  className="w-full h-auto object-cover"
                  src="/images/nepal_healthcare_tech.png"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="inline-block px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-widest rounded mb-6">
              Empowering Nepali Healthcare
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">
              Designed For Your Local Environment
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We understand the challenges you face in Nepal's healthcare
              landscape. Our system is engineered from the ground up to ensure
              your clinic operates without interruption.
            </p>

            <div className="space-y-6">
              {[
                {
                  title: "Low-Bandwidth Optimized",
                  desc: "Your software works swiftly even on slower networks.",
                },
                {
                  title: "Bilingual Interface",
                  desc: "Switch seamlessly between English and Nepali languages.",
                },
                {
                  title: "Local Integrations",
                  desc: "Integrated with local payment gateways and SMS providers.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center mt-1">
                    <svg
                      className="w-3 h-3 text-teal-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="text-center mb-12 max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            Hear From Your Peers
          </h2>
          <p className="text-slate-600">
            See how other clinics in Nepal are revolutionizing their patient
            care.
          </p>
        </div>
        <div className="max-w-4xl mx-auto px-4 h-64">
          <Carousel autoPlayInterval={6000} items={testimonials} />
        </div>
      </section>

      {/* CTA Layer */}
      <section className="py-20 bg-teal-700 border-y border-teal-800 text-center text-white px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 tracking-tight text-white">
            Ready to elevate your medical practice?
          </h2>
          <p className="text-teal-100 text-lg mb-10 leading-relaxed font-medium">
            Join the growing network of providers who have modernized their
            operations. Offer your patients the organized, quick, and secure
            medical care they expect.
          </p>
          <Link
            className="inline-block bg-white text-teal-800 font-bold px-10 py-4 text-sm uppercase tracking-wide rounded hover:bg-teal-50 transition-colors border-2 border-transparent hover:border-teal-200 focus:outline-none"
            to="/demo"
          >
            Start Your Digital Journey Today
          </Link>
          <p className="mt-8 text-sm text-teal-200 font-medium">
            No setup fees • Free training • 24/7 dedicated local support
          </p>
        </div>
      </section>
    </div>
  );
}
