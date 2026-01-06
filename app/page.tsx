'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './providers';
import {
  CheckCircle2,
  Zap,
  Gauge,
  Code2,
  Sparkles,
  ArrowRight,
  Star,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Github,
  Linkedin,
  Twitter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Data for Recharts visualization
const performanceData = [
  { name: 'Jan', SEO: 65, Performance: 72, NextJS: 68 },
  { name: 'Feb', SEO: 72, Performance: 78, NextJS: 75 },
  { name: 'Mar', SEO: 78, Performance: 82, NextJS: 80 },
  { name: 'Apr', SEO: 85, Performance: 87, NextJS: 86 },
  { name: 'May', SEO: 88, Performance: 91, NextJS: 89 },
  { name: 'Jun', SEO: 92, Performance: 94, NextJS: 93 },
];

const auditStatsData = [
  { name: 'SEO Issues', value: 35, color: '#3b82f6' },
  { name: 'Performance', value: 25, color: '#f97316' },
  { name: 'Best Practices', value: 20, color: '#8b5cf6' },
  { name: 'Optimized', value: 20, color: '#10b981' },
];

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Frontend Developer',
    company: 'TechStartup Inc',
    content:
      'RouteRank finally understands Next.js the way I do. The code-level fixes save me hours of debugging.',
    avatar: '👩‍💻',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Agency Owner',
    company: 'Digital Creative Co',
    content:
      'Our clients love the detailed reports. RouteRank makes us look like SEO experts.',
    avatar: '👨‍💼',
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    role: 'Full Stack Engineer',
    company: 'SaaS Solutions',
    content:
      'The performance metrics are spot-on. Helped us optimize our site from 62 to 94 score.',
    avatar: '👩‍🔬',
  },
];

const howItWorksSteps = [
  {
    title: 'Create your account',
    description: 'Get access to your dashboard and scanning tools.',
    body: 'Sign up in under a minute. Once you’re in, RouteRank unlocks the Dashboard, Scan, Settings, and History pages.',
    imageSrc: '/window.svg',
    imageAlt: 'Account setup illustration',
  },
  {
    title: 'Scan a URL',
    description: 'Paste a page and let RouteRank analyze it.',
    body: 'Open Scan, paste a URL (a marketing page or a specific route), then run a scan. RouteRank checks SEO fundamentals, performance signals, and Next.js best practices.',
    imageSrc: '/globe.svg',
    imageAlt: 'URL scanning illustration',
  },
  {
    title: 'Fix issues and track progress',
    description: 'Turn findings into changes you can verify.',
    body: 'Review the recommendations, fix what matters most, then rescan. Use History to compare results over time and confirm improvements.',
    imageSrc: '/file.svg',
    imageAlt: 'Report and improvements illustration',
  },
];

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const { isDarkMode } = useTheme();

  const chartGridStroke = isDarkMode ? '#374151' : '#e5e7eb';
  const chartAxisStroke = isDarkMode ? '#6b7280' : '#9ca3af';
  const chartTickFill = isDarkMode ? '#9ca3af' : '#4b5563';
  const chartTooltipBg = isDarkMode ? '#111827' : '#ffffff';
  const chartTooltipBorder = isDarkMode ? '#374151' : '#e5e7eb';
  const chartTooltipText = isDarkMode ? '#f9fafb' : '#111827';
  const chartLegendText = isDarkMode ? '#e5e7eb' : '#374151';

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-40 pb-24 sm:px-6 lg:px-8">
        {/* Background Ornaments */}
        <div className="absolute top-0 -left-20 w-160 h-160 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute top-40 -right-20 w-120 h-120 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-200 h-160 bg-pink-400/10 dark:bg-pink-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl relative">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Hero Content */}
            <div className="space-y-12">
              <div className="group inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/50 backdrop-blur-md dark:border-blue-900/40 dark:bg-blue-950/30 px-6 py-3 w-fit shadow-xl shadow-blue-500/10 hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span className="text-xs font-black tracking-[0.2em] text-blue-600 dark:text-blue-300 uppercase">
                  Built for Next.js developers
                </span>
              </div>

              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tighter">
                Your Next.js Site Deserves{' '}
                <span className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Better SEO
                </span>
              </h1>

              <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed font-medium">
                RouteRank isn&apos;t a generic SEO tool. We understand App
                Routers, metadata APIs, and performance. Get actionable insights
                that turn into real growth.
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-3 rounded-[2rem] bg-gray-900 dark:bg-white px-10 py-6 text-xl font-black text-white dark:text-gray-900 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-2xl shadow-gray-900/20 dark:shadow-white/10"
                >
                  Start Scanning Free
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-[2rem] border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-10 py-6 text-xl font-black text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300"
                >
                  Discover Features
                </a>
              </div>

              <div className="flex items-center gap-8 pt-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 w-14 rounded-full border-4 border-white dark:border-gray-950 bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 overflow-hidden flex items-center justify-center text-base font-black text-blue-600 dark:text-blue-400 shadow-lg"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-black text-gray-600 dark:text-gray-400">
                    Trusted by 500+ expert devs
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative group/hero-ui">
              <div className="absolute -inset-8 bg-linear-to-br from-blue-500/30 to-purple-500/30 dark:from-blue-600/20 dark:to-purple-600/20 rounded-[4rem] blur-[80px] group-hover/hero-ui:blur-[100px] transition-all duration-700"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-[3.5rem] p-12 border border-gray-100 dark:border-gray-800 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] dark:shadow-none">
                <div className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2.5">
                      <div className="h-4 w-4 rounded-full bg-red-400/80"></div>
                      <div className="h-4 w-4 rounded-full bg-yellow-400/80"></div>
                      <div className="h-4 w-4 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="px-5 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50 shadow-sm shadow-emerald-500/10">
                      System Optimized
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="h-6 bg-gray-50 dark:bg-gray-800/50 rounded-full w-full"></div>
                    <div className="h-6 bg-gray-50 dark:bg-gray-800/50 rounded-full w-2/3"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 pt-4">
                    {[
                      { label: 'SEO', val: 92, color: 'text-blue-600' },
                      { label: 'Perf', val: 98, color: 'text-orange-500' },
                      { label: 'Next', val: 100, color: 'text-purple-600' },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 text-center hover:scale-105 transition-transform duration-500"
                      >
                        <div
                          className={`text-5xl font-black ${stat.color} mb-2 tracking-tighter`}
                        >
                          {stat.val}
                        </div>
                        <div className="text-[11px] uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Faux Chart Area */}
                  <div className="h-44 w-full bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 flex items-end p-8 gap-4">
                    {[60, 40, 80, 50, 90, 70, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-linear-to-t from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/20"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="px-4 py-40 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/40 relative overflow-hidden"
      >
        {/* Background Ornaments */}
        <div className="absolute top-0 right-0 w-120 h-120 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-120 h-120 bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent"></div>

        <div className="mx-auto max-w-7xl relative">
          <div className="text-center mb-28">
            <h2 className="text-6xl sm:text-8xl font-black text-gray-900 dark:text-white mb-10 tracking-tighter">
              The{' '}
              <span className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Full
              </span>{' '}
              Audit
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
              We go deeper than generic SEO tools. We analyze your entire
              Next.js stack for optimization opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {/* SEO Feature */}
            <div className="group bg-white dark:bg-gray-800 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 p-14 hover:shadow-[0_32px_96px_-16px_rgba(59,130,246,0.15)] hover:-translate-y-3 transition-all duration-500">
              <div className="h-24 w-24 rounded-[2.5rem] bg-blue-600 flex items-center justify-center mb-12 shadow-[0_20px_40px_-8px_rgba(59,130,246,0.4)] group-hover:rotate-12 transition-transform duration-500">
                <Gauge className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter">
                SEO Foundation
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                Comprehensive SEO audit with title, meta descriptions, and
                semantic structure.
              </p>
              <ul className="space-y-5">
                {[
                  'Metadata API Validation',
                  'OpenGraph & Social Tags',
                  'Heading Hierarchy Check',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-5 text-sm font-black text-gray-700 dark:text-gray-300"
                  >
                    <div className="shrink-0 h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Performance Feature */}
            <div className="group bg-white dark:bg-gray-800 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 p-14 hover:shadow-[0_32px_96px_-16px_rgba(249,115,22,0.15)] hover:-translate-y-3 transition-all duration-500">
              <div className="h-24 w-24 rounded-[2.5rem] bg-orange-500 flex items-center justify-center mb-12 shadow-[0_20px_40px_-8px_rgba(249,115,22,0.4)] group-hover:-rotate-12 transition-transform duration-500">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter">
                Prime Flow
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                Core Web Vitals monitoring and automatic image optimization
                audits.
              </p>
              <ul className="space-y-5">
                {[
                  'Lighthouse Score Analysis',
                  'Core Web Vitals Monitoring',
                  'Image Compression Audit',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-5 text-sm font-black text-gray-700 dark:text-gray-300"
                  >
                    <div className="shrink-0 h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next.js Best Practices */}
            <div className="group bg-white dark:bg-gray-800 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 p-14 hover:shadow-[0_32px_96px_-16px_rgba(139,92,246,0.15)] hover:-translate-y-3 transition-all duration-500">
              <div className="h-24 w-24 rounded-[2.5rem] bg-purple-600 flex items-center justify-center mb-12 shadow-[0_20px_40px_-8px_rgba(139,92,246,0.4)] group-hover:rotate-12 transition-transform duration-500">
                <Code2 className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter">
                Next-Gen Tech
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                App Router intelligence and code-level fixes specifically for
                Next.js.
              </p>
              <ul className="space-y-5">
                {[
                  'Server Component Audit',
                  'Route-Based Intelligence',
                  'Actionable Code Snippets',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-5 text-sm font-black text-gray-700 dark:text-gray-300"
                  >
                    <div className="shrink-0 h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="px-4 py-32 sm:px-6 lg:px-8 bg-white dark:bg-gray-950 relative overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-160 h-160 bg-blue-100/30 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-160 h-160 bg-purple-100/30 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How it works in{' '}
              <span className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We&apos;ve streamlined the process of optimizing your Next.js site
              from start to finish.
            </p>
          </div>

          <div className="relative">
            {/* Desktop Stepped Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-blue-200 dark:via-blue-900/40 to-transparent -translate-y-1/2"></div>

            <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
              {howItWorksSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="group relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 pt-12 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center"
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 text-white font-bold shadow-xl group-hover:scale-110 transition-transform duration-500 ring-4 ring-white dark:ring-gray-950">
                    {index + 1}
                  </div>

                  {/* Icon Container */}
                  <div className="relative mb-8 p-5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-colors duration-500">
                    <div className="relative h-16 w-16">
                      <Image
                        src={step.imageSrc}
                        alt={step.imageAlt}
                        fill
                        className="object-contain drop-shadow-md"
                        sizes="64px"
                        priority={index === 0}
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                    {step.description}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.body}
                  </p>

                  {/* Decorative faint number in background */}
                  <span className="absolute bottom-4 right-6 text-8xl font-black text-gray-50 dark:text-gray-800/20 select-none pointer-events-none group-hover:text-blue-50 dark:group-hover:text-blue-900/10 transition-colors duration-500">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-20">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-10 py-5 text-lg font-bold text-white hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
            >
              Start Your First Scan
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics & Data Visualization Section */}
      <section
        id="charts"
        className="px-4 py-32 sm:px-6 lg:px-8 bg-white dark:bg-gray-950 relative overflow-hidden"
      >
        {/* Background Ornaments */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-160 h-160 bg-indigo-100/20 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Performance{' '}
              <span className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Insights
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Watch your scores improve over time with actionable
              recommendations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Line Chart */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Score Progression
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridStroke}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: chartTickFill }}
                    axisLine={{ stroke: chartAxisStroke }}
                    tickLine={{ stroke: chartAxisStroke }}
                  />
                  <YAxis
                    tick={{ fill: chartTickFill }}
                    axisLine={{ stroke: chartAxisStroke }}
                    tickLine={{ stroke: chartAxisStroke }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTooltipBg,
                      border: `1px solid ${chartTooltipBorder}`,
                      borderRadius: '8px',
                      color: chartTooltipText,
                    }}
                    labelStyle={{ color: chartTooltipText }}
                    itemStyle={{ color: chartTooltipText }}
                  />
                  <Legend wrapperStyle={{ color: chartLegendText }} />
                  <Line
                    type="monotone"
                    dataKey="SEO"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Performance"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="NextJS"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Audit Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={auditStatsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ x, y, name, value, textAnchor }) => (
                      <text
                        x={x}
                        y={y}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        fill={chartLegendText}
                        fontSize={12}
                      >
                        {`${name}: ${value}%`}
                      </text>
                    )}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {auditStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTooltipBg,
                      border: `1px solid ${chartTooltipBorder}`,
                      borderRadius: '8px',
                      color: chartTooltipText,
                    }}
                    labelStyle={{ color: chartTooltipText }}
                    itemStyle={{ color: chartTooltipText }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="px-4 py-32 sm:px-6 lg:px-8 bg-linear-to-b from-blue-50/50 dark:from-gray-900/40 to-white dark:to-gray-950 relative overflow-hidden"
      >
        {/* Background Ornaments */}
        <div className="absolute top-0 right-0 w-120 h-120 bg-blue-100/30 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by{' '}
              <span className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Developers
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              See what developers are saying about RouteRank
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>

              <p className="text-xl text-gray-900 dark:text-gray-100 mb-8 leading-relaxed">
                &ldquo;{testimonials[currentTestimonial].content}&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {testimonials[currentTestimonial].name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonials[currentTestimonial].role} at{' '}
                    {testimonials[currentTestimonial].company}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={prevTestimonial}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="px-4 py-32 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-900 relative overflow-hidden"
      >
        {/* Background Ornaments */}
        <div className="absolute bottom-0 right-0 w-160 h-160 bg-blue-100/20 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple,{' '}
              <span className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Transparent
              </span>{' '}
              Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the perfect plan for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg dark:hover:shadow-gray-900 transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Free
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Perfect for getting started
              </p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $0
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    1 scan per day
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Score summary
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Basic audit report
                  </span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="w-full block text-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-gray-900 dark:text-white transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="bg-linear-to-br from-blue-50 dark:from-blue-950/30 to-white dark:to-gray-900 rounded-xl border-2 border-blue-600 p-8 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Pro
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For serious developers
              </p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $19
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Unlimited scans
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Full audit breakdown
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Code fix suggestions
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    PDF export
                  </span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="w-full block text-center px-6 py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-shadow"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Agency
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                For teams & agencies
              </p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $49
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Everything in Pro
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Multiple sites
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    White-label PDFs
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Priority support
                  </span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="w-full block text-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-gray-900 dark:text-white transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-32 sm:px-6 lg:px-8 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        {/* Background Ornaments */}
        <div className="absolute top-0 left-0 w-120 h-120 bg-white/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-120 h-120 bg-white/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-3xl text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 tracking-tighter">
            Ready to Ship Better Next.js Sites?
          </h2>
          <p className="text-2xl text-blue-50/80 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Join 500+ developers who trust RouteRank to optimize their Next.js
            applications. Start with 1 free scan today.
          </p>
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-3 px-12 py-6 rounded-[2rem] bg-white text-blue-600 text-xl font-black hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-500/20"
          >
            Start Your Free Scan
            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">RouteRank</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                SEO audits built specifically for Next.js developers.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 dark:border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                © 2026 RouteRank. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA Button */}
      {isSticky && (
        <Link
          href="/signup"
          className="fixed bottom-8 right-8 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg dark:shadow-blue-500/50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
        >
          Get Started
        </Link>
      )}
    </div>
  );
}
