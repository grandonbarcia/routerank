'use client';

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
      <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/30 px-4 py-2 w-fit">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                  Built for Next.js developers
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
                Your Next.js Site Deserves{' '}
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Better SEO
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                RouteRank isn&apos;t a generic SEO tool. We understand App
                Routers, metadata APIs, image optimization, and the things that
                matter to Next.js developers. Get actionable insights, not
                buzzwords.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white hover:shadow-lg transition-all duration-200"
                >
                  Start Scanning Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-4 text-lg font-semibold text-gray-900 dark:text-gray-100 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Learn More
                </a>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Trusted by 500+ developers worldwide
                </p>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/40 dark:to-purple-950/40 rounded-2xl blur-2xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-950 rounded-2xl p-8 border border-blue-100 dark:border-gray-800 shadow-xl">
                <div className="space-y-4">
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-900/40 dark:to-blue-800/40 rounded w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-900/40 dark:to-blue-800/40 rounded w-2/3"></div>
                  <div className="pt-8 grid grid-cols-3 gap-4">
                    {['SEO', 'Performance', 'Next.js'].map((label, i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-gray-800"
                      >
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          92
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {label}
                        </div>
                      </div>
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
        className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything We Check
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built specifically for Next.js. Not like generic SEO tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* SEO Feature */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-6">
                <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                SEO Foundation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comprehensive SEO audit with title, meta descriptions, OpenGraph
                tags, heading structure, and more.
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Title & meta validation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  OpenGraph tags
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Heading hierarchy
                </li>
              </ul>
            </div>

            {/* Performance Feature */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Performance Metrics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Lighthouse scores, Core Web Vitals, image optimization, and
                resource analysis.
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Lighthouse audits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Core Web Vitals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Image optimization
                </li>
              </ul>
            </div>

            {/* Next.js Best Practices */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-shadow duration-300">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-6">
                <Code2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Next.js Best Practices
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                App Router intelligence, metadata API usage, and code-level fix
                suggestions.
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Metadata coverage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Route analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  Code fixes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics & Data Visualization Section */}
      <section
        id="charts"
        className="px-4 py-20 sm:px-6 lg:px-8 bg-white dark:bg-gray-950"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Performance Insights
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
        className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 dark:from-gray-900 to-white dark:to-gray-950"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Developers
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
        className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
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
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    1 scan per day
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Score summary
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
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
            <div className="bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-white dark:to-gray-900 rounded-xl border-2 border-blue-600 p-8 relative shadow-xl">
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
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Unlimited scans
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Full audit breakdown
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Code fix suggestions
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    PDF export
                  </span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="w-full block text-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-shadow"
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
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Everything in Pro
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Multiple sites
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    White-label PDFs
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
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
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Ship Better Next.js Sites?
          </h2>
          <p className="text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
            Join 500+ developers who trust RouteRank to optimize their Next.js
            applications. Start with 1 free scan today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-white text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Your Free Scan
            <ArrowRight className="h-5 w-5" />
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
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
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
