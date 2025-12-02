import Link from 'next/link';
import Button from './ui/Button';

export default function Hero() {
    return (
        <div className="relative overflow-hidden bg-white pt-16 pb-32 space-y-24">
            <div className="relative">
                <div className="lg:mx-auto lg:grid lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-2 lg:gap-24 lg:px-8">
                    <div className="mx-auto max-w-xl px-6 lg:mx-0 lg:max-w-none lg:px-0 lg:py-16">
                        <div>
                            <div className="mt-6">
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                                    Plan the perfect hangout with your friends.
                                </h1>
                                <p className="mt-4 text-lg text-gray-500">
                                    Stop arguing about where to go. Let our AI find the perfect spot that works for everyone&apos;s location, budget, and mood.
                                </p>
                                <div className="mt-6 flex gap-4">
                                    <Link href="/create">
                                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30">
                                            Create Group
                                        </Button>
                                    </Link>
                                    <Link href="/duo-date">
                                        <Button size="lg" variant="outline" className="border-pink-500 text-pink-600 hover:bg-pink-50">
                                            Plan a Date 💕
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 sm:mt-16 lg:mt-0">
                        <div className="-mr-48 pl-6 md:-mr-16 lg:relative lg:m-0 lg:h-full lg:px-0">
                            <div className="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 lg:absolute lg:left-0 lg:h-full lg:w-auto lg:max-w-none overflow-hidden bg-gray-50">
                                {/* Placeholder for hero image or illustration */}
                                <div className="flex items-center justify-center h-full min-h-[400px] bg-gradient-to-br from-indigo-50 to-pink-50">
                                    <div className="text-center p-8">
                                        <div className="text-6xl mb-4">🗺️ ✨ 📍</div>
                                        <p className="text-gray-400 font-medium">AI-Powered Planning</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
