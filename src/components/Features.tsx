export default function Features() {
    const features = [
        {
            name: 'Smart Location Discovery',
            description: 'Our AI calculates the perfect centroid meeting point that\'s equally convenient for everyone in your group.',
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'bg-blue-50',
        },
        {
            name: 'Budget Friendly',
            description: 'Set individual budgets and we\'ll suggest places that fit everyone\'s wallet without awkward conversations.',
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            ),
            color: 'from-emerald-500 to-teal-500',
            bgColor: 'bg-emerald-50',
        },
        {
            name: 'Mood Based Suggestions',
            description: 'Whether you want chill vibes, adventure, or food hopping — we curate the perfect itinerary for your mood.',
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50',
        },
        {
            name: 'Real-time Voting',
            description: 'Vote on suggested itineraries with your group in real-time and reach a democratic decision together.',
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'from-amber-500 to-orange-500',
            bgColor: 'bg-amber-50',
        },
        {
            name: 'Detailed Itineraries',
            description: 'Get complete day plans with specific venues, activities, estimated costs, and travel times between spots.',
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            color: 'from-rose-500 to-red-500',
            bgColor: 'bg-rose-50',
        },
        {
            name: 'Share & Invite',
            description: 'Easily share your group with a unique code or link. Friends can join instantly without signing up first.',
            icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            ),
            color: 'from-cyan-500 to-blue-500',
            bgColor: 'bg-cyan-50',
        },
    ];

    return (
        <section id="features" className="section bg-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50" />
            
            <div className="container-custom relative">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
                    <span className="badge badge-primary mb-4">Features</span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">
                        Everything you need to plan the
                        <span className="gradient-text"> perfect hangout</span>
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        No more endless &quot;I don&apos;t know, where do you want to go?&quot; debates. 
                        Get straight to the fun part with our intelligent planning tools.
                    </p>
                </div>
                
                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <div 
                            key={feature.name} 
                            className="group card card-hover p-8 animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <div className={`text-transparent bg-clip-text bg-gradient-to-br ${feature.color}`}>
                                    <div className="text-indigo-600">
                                        {feature.icon}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                {feature.name}
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
