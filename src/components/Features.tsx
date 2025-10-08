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
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need for perfect meetups
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From smart suggestions to seamless coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up ${
                index === 0 ? 'animate-delay-100' :
                index === 1 ? 'animate-delay-200' :
                index === 2 ? 'animate-delay-300' :
                index === 3 ? 'animate-delay-100' :
                'animate-delay-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
