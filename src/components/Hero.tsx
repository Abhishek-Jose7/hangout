import Link from 'next/link';
import Button from './ui/Button';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up">
            Plan the perfect hangout —{' '}
            <span className="text-blue-600">together</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animate-delay-100">
            Create or join groups, find the best meetup spot, and decide together — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animate-delay-200">
            <Link href="/create">
              <Button
                size="lg"
                className="min-w-[160px]"
              >
                Create Group
              </Button>
            </Link>

            <Link href="/join">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[160px]"
              >
                Join Group
              </Button>
            </Link>
          </div>
        </div>

        {/* Optional illustration area */}
        <div className="mt-16 flex justify-center animate-fade-in-up animate-delay-300">
          <div className="w-full max-w-md h-64 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-2">🗺️</div>
              <p className="text-sm">Interactive map preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
