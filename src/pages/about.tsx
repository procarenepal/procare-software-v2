import { Link } from "react-router-dom";
import {
  Building2,
  HeartPulse,
  MapPin,
  CalendarDays,
  Users,
  Activity,
  Lightbulb,
  Handshake,
  ArrowRight,
  MonitorSmartphone,
  BarChart3,
  Globe2,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-20 lg:py-28 max-w-4xl mx-auto flex flex-col items-center text-center overflow-hidden">
        <div className="flex flex-wrap gap-2 justify-center mb-8 relative z-10">
          <span className="flex items-center gap-1.5 bg-teal-100 text-teal-800 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-teal-200">
            <Building2 className="w-4 h-4" /> Proudly Nepali
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase border border-slate-200">
            <HeartPulse className="w-4 h-4" /> Healthcare Innovation
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 tracking-tight leading-tight relative z-10">
          About <span className="text-teal-700">Procare Nepal</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl font-medium leading-relaxed relative z-10">
          Empowering healthcare providers across Nepal with technology
          engineered specifically for local operational realities. Constructed
          by Nepalis, securing Nepal’s digital medical future.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-500 relative z-10">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>Founded in 2023</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>100% Local Team</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span>500+ Clinics</span>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-24 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">
              Our Development Story
            </h2>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed font-medium">
              <p>
                Procare Software Nepal emerged in 2023 from a vital
                collaboration between seasoned medical professionals and
                dedicated software engineers who identified critical systemic
                frictions across clinical management in our country.
              </p>
              <p>
                Witnessing facilities grapple with fragile paper architectures
                or exorbitant, incompatible foreign software, we committed to
                engineering a resilient, highly optimized, and fiscally
                accessible platform calibrated purely for the dynamic Nepali
                healthcare environment.
              </p>
              <p>
                We execute continuous field testing—from high-density Kathmandu
                hospitals to rural outposts—ensuring our infrastructure remains
                robust through bandwidth latency, variable technical literacy,
                and complex localized billing requirements.
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-teal-100 rounded-xl transform rotate-2 group-hover:rotate-3 transition-transform duration-500 border border-teal-200" />
            <div className="clarity-card p-3 bg-white border border-slate-200 rounded-xl relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
              <div className="rounded-lg border border-slate-100 overflow-hidden bg-slate-50">
                <img
                  alt="Modern abstract Nepali healthcare tech"
                  className="w-full h-auto object-cover aspect-video"
                  src="/images/banner_about.png"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=2070&q=80";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Mission */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-800 px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide border border-slate-300 mb-8">
            <Activity className="w-5 h-5 text-slate-700" />
            Our Mission Directive
          </div>

          <blockquote className="text-2xl lg:text-3xl text-slate-900 leading-relaxed font-bold mb-16 tracking-tight">
            "We systematically dismantle clinical inefficiencies in Nepal by
            deploying robust, localized software architecture, optimizing
            patient outcomes while respecting operational realities."
          </blockquote>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: <MapPin className="w-8 h-8 text-teal-700" />,
                title: "Geographic Context",
                desc: "Codebases tailored strictly for Nepal's infrastructural boundaries and medical operational standards.",
              },
              {
                icon: <Lightbulb className="w-8 h-8 text-teal-700" />,
                title: "Architectural Innovation",
                desc: "Modern zero-latency interfaces fused with practical, flat, low-strain clinical design aesthetics.",
              },
              {
                icon: <Handshake className="w-8 h-8 text-teal-700" />,
                title: "Strategic Partnerships",
                desc: "We don't just sell software; we commit to the technological evolution of your clinic.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 border border-slate-200 rounded-md clarity-card"
              >
                <div className="w-14 h-14 bg-teal-50 rounded bg-opacity-50 border border-teal-100 flex items-center justify-center mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                  {value.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Leadership */}
      <section className="py-24 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide border border-slate-200 mb-4">
              <Users className="w-5 h-5 text-slate-600" />
              Executive Leadership
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Meet Our CEO
            </h2>
            <p className="text-lg text-slate-600">
              Sanjeev Baral spearheads Procare Software Nepal with
              uncompromising dedication. His technical vision accelerates our
              mission to supply high-fidelity, locally-adapted clinical systems.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-md clarity-card text-center hover:border-teal-400 transition-colors">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-teal-200 rounded-full blur-md opacity-50 transform scale-110" />
                <img
                  alt="Sanjeev Baral"
                  className="w-32 h-32 rounded-full object-cover relative z-10 border-2 border-slate-200 shadow-sm"
                  src="https://procarenepal.com/assets/founder-DS_eS69g.jpeg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"; // Professional placeholder
                  }}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">
                Sanjeev Baral
              </h3>
              <p className="text-teal-700 font-bold uppercase tracking-wider text-sm mb-4">
                Founder & CEO
              </p>
              <p className="text-slate-600 leading-relaxed font-medium">
                Sanjeev anchors Procare Nepal's technical and operational
                roadmap. Fusing years of cross-sector expertise, he drives the
                deployment of resilient industry standards directly into
                previously underserved medical facilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillar Approach */}
      <section className="py-24 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
              Our Development Methodology
            </h2>
            <p className="text-lg text-slate-600">
              Four concrete pillars defining our architecture, strategy, and
              execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Engineered strict for Nepal",
                description:
                  "Built ground-up for erratic connectivity and power fluctuations mapping precisely to non-standardized clinical workflows. Features natively integrate Nepali linguistic and calendric requirements.",
                icon: <Globe2 className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Natively Local Engineering",
                description:
                  "Abandon heavy legacy support channels. Our core engineering team resides in Nepal, supplying high-velocity remote resolution and strategic on-site integration without international friction.",
                icon: <Users className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Iterative Rapid Enhancement",
                description:
                  "We execute bi-weekly deployment cycles dictated by actual ground-floor telemetry. If a workflow introduces friction to a receptionist, we refactor it immediately.",
                icon: <BarChart3 className="w-6 h-6 text-teal-700" />,
              },
              {
                title: "Defensible Scalable Pricing",
                description:
                  "Enterprise features shouldn't mandate enterprise bloat. We aggressively optimized our cloud layer to pass unprecedented cost-efficiency to growing facilities.",
                icon: <MonitorSmartphone className="w-6 h-6 text-teal-700" />,
              },
            ].map((approach, index) => (
              <div
                key={index}
                className="flex gap-4 p-6 bg-white border border-slate-200 rounded-md clarity-card hover:border-teal-500 transition-colors"
              >
                <div className="w-12 h-12 bg-slate-50 flex-shrink-0 border border-slate-100 rounded-md flex items-center justify-center mb-4">
                  {approach.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {approach.title}
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {approach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Statistics */}
      <section className="py-20 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "100+", label: "Active Deployments" },
              { number: "75", label: "Districts Supported" },
              { number: "30k+", label: "Patients Processed" },
              { number: "99.9%", label: "Cloud Uptime" },
            ].map((stat, index) => (
              <div
                key={index}
                className="p-4 border-l border-slate-800 first:border-l-0"
              >
                <p className="text-4xl lg:text-5xl font-bold text-teal-400 mb-2 tracking-tight">
                  {stat.number}
                </p>
                <p className="text-slate-400 font-semibold uppercase tracking-wider text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal CTA */}
      <section className="py-24 bg-teal-800 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl font-bold mb-6 text-white tracking-tight">
            Initiate Consultation Sequence
          </h2>
          <p className="text-teal-100 text-lg mb-10 font-medium leading-relaxed">
            Our technical specialists will run a comprehensive diagnostic of
            your clinic's digital needs and demonstrate precise optimization
            strategies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full sm:w-auto">
            <Link
              className="bg-white text-teal-900 font-bold px-10 py-4 text-sm uppercase tracking-wider hover:bg-slate-100 transition-colors rounded border-2 border-transparent focus:outline-none flex items-center justify-center gap-2"
              to="/demo"
            >
              Request Live Diagnostics <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center text-teal-200 text-sm font-semibold tracking-wide border-t border-teal-700 pt-8 w-full">
            <div className="flex items-center gap-2 justify-center">
              <MapPin className="w-5 h-5 text-teal-400" /> Tripureshwor,
              Kathmandu, Nepal
            </div>
            <div className="flex items-center gap-2 justify-center">
              <MonitorSmartphone className="w-5 h-5 text-teal-400" /> +977
              986-0577865
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
