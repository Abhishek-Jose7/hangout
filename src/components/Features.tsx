export default function Features() {
  const features = [
    {
      icon: '📍',
      title: 'Smart Location Suggestions',
      description: 'Finds the best meetup point based on everyone\'s location.'
    },
    {
      icon: '💬',
      title: 'Group Voting',
      description: 'Vote and decide the perfect hangout place together.'
    },
    {
      icon: '⚡',
      title: 'Real-time Coordination',
      description: 'Track who\'s joining, ETA, and final spot live.'
    },
    {
      icon: '💰',
      title: 'Budget Matching',
      description: 'Suggests spots that fit everyone\'s budget.'
    },
    {
      icon: '🎭',
      title: 'Vibe Selector',
      description: 'Choose from chill, romantic, or fun vibes for better matches.'
    },
    {
      icon: '💕',
      title: 'Duo Date Planner',
      description: 'Special feature for planning perfect dates with your special someone.'
    }
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50/50 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-50/50 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            Everything you need for perfect meetups
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From smart suggestions to seamless coordination, we&apos;ve got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group bg-white border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up ${index === 0 ? 'delay-100' :
                index === 1 ? 'delay-200' :
                  index === 2 ? 'delay-300' :
                    index === 3 ? 'delay-100' :
                      'delay-200'
                }`}
            >
              <div className="flex flex-col h-full">
                <div className="w-14 h-14 flex items-center justify-center bg-indigo-50 rounded-2xl text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
