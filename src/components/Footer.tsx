import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="contact" className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 mb-6 inline-block">
              Hangout
            </Link>
            <p className="text-slate-600 mb-6 max-w-md leading-relaxed">
              Plan the perfect hangout with friends. Find the best meetup spots, coordinate in real-time, and make decisions together.
            </p>
            <div className="flex space-x-4">
              {/* Social icons could go here */}
            </div>
          </div>

          {/* Navigation links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">
              Platform
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Create Group
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact/Support */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">
              Support
            </h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Hangout Planner. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              Made with <span className="text-red-500">❤️</span> for better hangouts
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
