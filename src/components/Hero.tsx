import Link from 'next/link';
import Button from './ui/Button';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white opacity-70"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-violet-100/50 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-100/50 to-transparent blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full bg-indigo-50 border border-indigo-100 animate-fade-in-up">
            <span className="text-sm font-medium text-indigo-600">✨ The new way to plan meetups</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight tracking-tight animate-fade-in-up delay-100">
            Plan the perfect hangout <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600">
              together
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Create groups, vote on locations, and decide where to go in seconds. No more endless group chat debates.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
            <Link href="/create">
              <Button
                variant="gradient"
                size="lg"
                className="min-w-[180px] shadow-xl shadow-indigo-500/20"
                rightIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
              >
                Create Group
              </Button>
            </Link>

            <Link href="/join">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[180px] bg-white/50 backdrop-blur-sm"
              >
                Join Group
              </Button>
            </Link>
          </div>

          <div className="mt-8 animate-fade-in-up delay-400">
            <Link href="/duo-date">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-pink-600 transition-colors cursor-pointer group">
                Looking for a date plan?
                <span className="border-b border-pink-300 group-hover:border-pink-600">Try our Duo Date Planner</span>
                <span>💕</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Hero Image / Preview */}
        <div className="mt-20 relative animate-fade-in-up delay-500">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl opacity-20 blur-2xl -z-10"></div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl">
            <div className="aspect-[16/9] flex items-center justify-center bg-slate-50">
              {/* Placeholder for actual app screenshot or interactive map */}
              <div className="text-center p-12">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                  📍
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Interactive Map Preview</h3>
                <p className="text-slate-500">Real-time location sharing and voting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
