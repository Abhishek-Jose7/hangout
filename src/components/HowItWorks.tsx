import Link from 'next/link';
import Button from './ui/Button';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create or Join',
      description: 'Start a new group or join an existing one with a simple code. No sign-up required for guests.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
    },
    {
      number: '02',
      title: 'Add Preferences',
      description: 'Share your location, budget, and vibe preferences. We keep it private and secure.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-600',
    },
    {
      number: '03',
      title: 'Get AI Suggestions',
      description: 'Our smart algorithm finds the perfect meetup spots that work for everyone in the group.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-600',
    },
    {
      number: '04',
      title: 'Vote & Finalize',
      description: 'Vote on suggestions and finalize your perfect hangout spot together in seconds.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-600',
    }
  ];

  return (
    <section id="how-it-works" className="section bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-100/40 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-100/40 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container-custom relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="badge badge-primary mb-4">How It Works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">
            Plan your hangout in
            <span className="gradient-text"> 4 simple steps</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            From creating a group to finalizing plans, we&apos;ve made it incredibly simple. 
            No more coordination nightmares.
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative max-w-5xl mx-auto mb-16">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 via-amber-200 to-emerald-200" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Step Card */}
                <div className="bg-white rounded-3xl p-8 h-full border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500 hover:-translate-y-1">
                  {/* Step Number Badge */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  
                  {/* Number Tag */}
                  <div className="absolute top-4 right-4 text-6xl font-black text-slate-50 group-hover:text-indigo-50 transition-colors select-none">
                    {step.number}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed relative z-10">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector - Mobile/Tablet */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="inline-block">
            <div className="glass rounded-3xl p-2 shadow-xl shadow-indigo-500/10">
              <div className="flex flex-col sm:flex-row gap-3 p-2">
                <Link href="/create">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto shadow-lg shadow-indigo-500/25"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Start Planning Now
                  </Button>
                </Link>
                <Link href="/join">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Join a Group
                  </Button>
                </Link>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No credit card required • Free forever for personal use
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
