
import ReportSection from "./ReportSection";

import {
  ArrowRight,
  AudioLines,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Globe2,
  MapPin,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: AudioLines,
    title: "Voice-Based Complaints",
    description:
      "Speak naturally in your preferred language. Our AI converts your voice into a structured complaint.",
  },
  {
    icon: Camera,
    title: "AI Evidence Verification",
    description:
      "Upload photographs of civic problems. AI analyses visible issues using computer vision.",
  },
  {
    icon: Globe2,
    title: "Multilingual Support",
    description:
      "Report problems in English, Hindi, Marathi and other supported languages.",
  },
  {
    icon: ClipboardList,
    title: "Complaint Tracking",
    description:
      "Keep track of your complaint and follow its progress through a clear status timeline.",
  },
];

const steps = [
  {
    number: "01",
    title: "Report an issue",
    description: "Describe the civic problem using text or your voice.",
  },
  {
    number: "02",
    title: "AI analyses it",
    description: "AI understands the complaint and checks uploaded evidence.",
  },
  {
    number: "03",
    title: "Confirm details",
    description: "Review the complaint information before submitting it.",
  },
  {
    number: "04",
    title: "Track progress",
    description: "Receive a tracking ID and monitor complaint updates.",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-800 text-white">
              <ShieldCheck size={25} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-blue-950">
                JanSahayak <span className="text-teal-600">AI</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
                Smart Civic Assistance
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#home" className="hover:text-blue-700">Home</a>
            <a href="#features" className="hover:text-blue-700">Features</a>
            <a href="#how-it-works" className="hover:text-blue-700">How it works</a>
            <a href="#about" className="hover:text-blue-700">About</a>
          </div>

          <a
            href="#report"
            className="hidden items-center gap-2 rounded-lg bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 sm:flex"
          >
            Report an Issue <ArrowRight size={16} />
          </a>

          <a
            href="#report"
            className="rounded-lg p-2 text-blue-900 md:hidden"
            aria-label="Go to complaint reporting"
          >
            <Menu size={25} />
          </a>

        </nav>
      </header>

      <main>

        {/* Hero Section */}
        <section id="home" className="relative overflow-hidden bg-slate-50">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-2 md:py-28">

            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
                <Sparkles size={16} />
                AI-powered civic assistance
              </div>

              <h2 className="max-w-2xl text-5xl font-extrabold leading-[1.12] tracking-tight text-slate-950 md:text-6xl">
                Your City.
                <br />
                Your Voice.
                <br />
                <span className="text-blue-800">Your Solution.</span>
              </h2>

              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                Report civic problems without complications. Use your voice,
                share a photograph, and let AI help turn your concern into
                a structured complaint.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="#report"
                  className="inline-flex items-center gap-3 rounded-xl bg-blue-800 px-7 py-4 font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-1 hover:bg-blue-900"
                >
                  Register a Complaint <ArrowRight size={19} />
                </a>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-4 font-semibold text-slate-700 transition hover:border-blue-700 hover:text-blue-800"
                >
                  Learn More <ChevronRight size={18} />
                </a>
              </div>

              <div className="mt-9 flex flex-wrap gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-teal-600" />
                  Voice enabled
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-teal-600" />
                  AI assisted
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-teal-600" />
                  Easy tracking
                </span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />
              <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-teal-200/60 blur-3xl" />

              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/50 md:p-8">

                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      CITIZEN ASSISTANT
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      How can we help?
                    </h3>
                  </div>

                  <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                    <MessageSquareText size={25} />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Example complaint
                  </p>

                  <p className="mt-3 leading-7 text-slate-700">
                    Garbage has not been collected in my area for the last
                    three days.
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-700">
                    <MapPin size={16} />
                    Location details can be added
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <AudioLines className="mb-3 text-blue-700" size={24} />
                    <p className="font-semibold">Speak</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Voice complaint
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <Camera className="mb-3 text-teal-700" size={24} />
                    <p className="font-semibold">Upload</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add photo evidence
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                  <div className="rounded-lg bg-blue-800 p-2 text-white">
                    <Zap size={19} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-blue-950">
                      AI-assisted reporting
                    </p>
                    <p className="text-xs text-blue-700">
                      Understand. Verify. Submit.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-24">

          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[3px] text-teal-700">
              What we offer
            </p>

            <h2 className="mt-4 text-3xl font-extrabold text-slate-950 md:text-4xl">
              Civic reporting, made simpler.
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              Technology designed to make reporting civic issues easier,
              clearer and more accessible.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl"
                >
                  <div className="inline-flex rounded-xl bg-blue-50 p-4 text-blue-800">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-6">

            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[3px] text-teal-700">
                Simple process
              </p>

              <h2 className="mt-4 text-3xl font-extrabold text-slate-950 md:text-4xl">
                Four steps. One clear process.
              </h2>

              <p className="mt-5 text-slate-600">
                From describing a problem to tracking your complaint.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative rounded-2xl bg-white p-7 shadow-sm"
                >
                  <p className="text-4xl font-extrabold text-blue-100">
                    {step.number}
                  </p>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* NEW: Complaint Registration Section */}
        <ReportSection />

        {/* About Section */}
        <section id="about" className="mx-auto max-w-7xl px-6 py-24">
          <div className="rounded-3xl bg-blue-950 px-7 py-14 text-center text-white md:px-16">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck size={30} />
            </div>

            <h2 className="mt-6 text-3xl font-extrabold md:text-4xl">
              Better cities begin with better reporting.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
              JanSahayak AI aims to make civic issue reporting more accessible
              through multilingual interaction, AI-assisted understanding and
              evidence analysis.
            </p>

            <a
              href="#report"
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-7 py-4 font-bold text-blue-950 transition hover:bg-blue-50"
            >
              Get Started <ArrowRight size={18} />
            </a>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">

          <div>
            <h3 className="font-extrabold text-blue-950">
              JanSahayak AI
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your voice. Your city. Your solution.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            A civic technology project · 2026
          </p>

        </div>
      </footer>

    </div>
  );
}

export default App;
