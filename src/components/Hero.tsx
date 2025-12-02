import Link from 'next/link';
import Button from './ui/Button';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 gradient-bg-subtle" />
            <div className="absolute inset-0 overflow-hidden">
                {/* Animated Gradient Orbs */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-violet-400/30 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-float delay-300" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full blur-3xl" />
            </div>
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

            <div className="container-custom relative z-10 pt-32 pb-20">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left">
                        <div className="animate-fade-in-up">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 border border-indigo-200 mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="text-sm font-semibold text-indigo-700">AI-Powered Planning</span>
                            </div>
                            
                            {/* Headline */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
                                Plan the
                                <span className="gradient-text"> perfect hangout </span>
                                with friends
                            </h1>
                            
                            {/* Subheadline */}
                            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                Stop the endless &quot;where should we go?&quot; debate. Our AI finds the 
                                <span className="font-semibold text-slate-800"> optimal meeting spot </span>
                                based on everyone&apos;s location, budget, and mood.
                            </p>
                            
                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/create">
                                    <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Group
                                    </Button>
                                </Link>
                                <Link href="/duo-date">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        Plan a Date
                                    </Button>
                                </Link>
                            </div>
                            
                            {/* Stats */}
                            <div className="mt-12 grid grid-cols-3 gap-8 max-w-md mx-auto lg:mx-0">
                                <div className="text-center lg:text-left">
                                    <div className="text-3xl font-bold gradient-text">Free</div>
                                    <div className="text-sm text-slate-500 mt-1">No API costs</div>
                                </div>
                                <div className="text-center lg:text-left">
                                    <div className="text-3xl font-bold gradient-text">AI</div>
                                    <div className="text-sm text-slate-500 mt-1">Smart discovery</div>
                                </div>
                                <div className="text-center lg:text-left">
                                    <div className="text-3xl font-bold gradient-text">Real</div>
                                    <div className="text-sm text-slate-500 mt-1">Actual places</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Content - Visual */}
                    <div className="relative animate-fade-in-up delay-200">
                        <div className="relative">
                            {/* Main Card */}
                            <div className="card p-8 shadow-2xl shadow-indigo-500/10">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">Saturday Hangout</div>
                                            <div className="text-sm text-slate-500">4 friends • ₹800 avg budget</div>
                                        </div>
                                    </div>
                                    <span className="badge badge-success">Live</span>
                                </div>
                                
                                {/* Members */}
                                <div className="flex -space-x-3 mb-6">
                                    {['🧑', '👩', '👨', '👧'].map((emoji, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white flex items-center justify-center text-lg">
                                            {emoji}
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full gradient-bg border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                        +2
                                    </div>
                                </div>
                                
                                {/* Location Suggestion */}
                                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-100">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                                            📍
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-900">Bandra West, Mumbai</div>
                                            <div className="text-sm text-slate-600 mt-1">Optimal meetup point for everyone</div>
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="text-xs text-indigo-600 font-semibold">★ 4.5 rated spots</span>
                                                <span className="text-xs text-slate-500">15-20 min for all</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Activities Preview */}
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {['☕ Cafe Hopping', '🎬 Movie', '🍕 Pizza'].map((activity) => (
                                        <span key={activity} className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm text-slate-700">
                                            {activity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Floating Elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-white shadow-xl shadow-pink-500/10 flex items-center justify-center animate-float">
                                <span className="text-3xl">💕</span>
                            </div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl bg-white shadow-xl shadow-indigo-500/10 flex items-center justify-center animate-float delay-200">
                                <span className="text-2xl">✨</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 rounded-full border-2 border-slate-300 flex items-start justify-center p-2">
                    <div className="w-1.5 h-3 bg-slate-400 rounded-full animate-pulse" />
                </div>
            </div>
        </section>
    );
}
