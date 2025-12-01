import Link from 'next/link';
import Button from './ui/Button';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create or Join',
      description: 'Start a new group or join an existing one with a simple code. No sign-up required for guests.'
    },
    {
      number: '02',
      title: 'Add Preferences',
      description: 'Share your location, budget, and vibe preferences. We keep it private and secure.'
    },
    {
      number: '03',
      title: 'Get AI Suggestions',
      description: 'Our smart algorithm finds the perfect meetup spots that work for everyone in the group.'
    },
    {
      number: '04',
      title: 'Vote & Finalize',
      description: 'Vote on suggestions and finalize your perfect hangout spot together in seconds.'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Simple steps to plan the perfect hangout with friends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className={`relative group animate-fade-in-up ${index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : index === 2 ? 'delay-300' : 'delay-400'}`}>
              <div className="bg-white rounded-2xl p-8 h-full border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-5xl font-bold text-slate-100 mb-6 group-hover:text-indigo-50 transition-colors">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200 -translate-y-1/2 z-10"></div>
              )}
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center animate-fade-in-up delay-500">
          <div className="inline-block p-1 rounded-2xl bg-white border border-slate-200 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-2 p-2">
              <Link href="/create">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Start Planning
                </Button>
              </Link>
              <Link href="/join">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Join a Group
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
