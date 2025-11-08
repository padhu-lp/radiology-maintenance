import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📋</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Radiology Manager
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Radiology Equipment Management
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Streamline your radiology department's equipment maintenance, work orders, and quality control testing all in one intuitive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
          Key Features
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-3xl mb-4">🏥</div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Equipment Tracking
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              Monitor all radiology equipment with detailed inventory, serial numbers, and warranty information.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-3xl mb-4">🔧</div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Work Orders
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              Create, assign, and track maintenance work orders with costs and downtime tracking.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="text-3xl mb-4">✅</div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Quality Control
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              Schedule and manage QC tests with detailed protocols and compliance tracking.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to optimize your radiology department?
          </h3>
          <p className="text-blue-100 mb-8 text-lg">
            Join healthcare organizations using Radiology Manager to streamline operations.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-600 dark:text-slate-400">
          <p>&copy; 2024 Radiology Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
