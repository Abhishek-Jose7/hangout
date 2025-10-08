export default function HowItWorks() {
  const steps = [
    {
      number: '1️⃣',
      title: 'Create or Join a Group',
      description: 'Start a new group or join an existing one with a simple code.'
    },
    {
      number: '2️⃣',
      title: 'Add Preferences',
      description: 'Share your location, budget, and vibe preferences with the group.'
    },
    {
      number: '3️⃣',
      title: 'Get AI Suggestions',
      description: 'Our smart algorithm finds the perfect meetup spots for everyone.'
    },
    {
      number: '4️⃣',
      title: 'Vote & Finalize',
      description: 'Vote on suggestions and finalize your perfect hangout spot together.'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple steps to plan the perfect hangout with friends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className={`text-center animate-fade-in-up ${index === 0 ? 'animate-delay-100' : index === 1 ? 'animate-delay-200' : index === 2 ? 'animate-delay-300' : 'animate-delay-400'}`}>
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-2xl rounded-full mb-4 shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connecting line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-blue-200 transform translate-x-8"></div>
              )}
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16 animate-fade-in-up animate-delay-400">
          <p className="text-gray-600 mb-6">
            Ready to start planning your next hangout?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/create"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </a>
            <a
              href="/join"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-semibold rounded-xl transition-all duration-200"
            >
              Join a Group
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
