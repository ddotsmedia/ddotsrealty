import Link from "next/link";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-slate-900">DdotsRealty</div>
          </div>
          <nav className="flex gap-6">
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              Home
            </Link>
            <Link
              href="/listings"
              className="text-slate-600 hover:text-slate-900"
            >
              Listings
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900">
              About
            </Link>
            <Link
              href="/contact"
              className="text-slate-600 hover:text-slate-900"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">DdotsRealty</h3>
              <p className="text-sm text-slate-600">
                Your trusted real estate partner in the UAE.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/" className="hover:text-slate-900">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/listings" className="hover:text-slate-900">
                    Listings
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-slate-900">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="mailto:info@ddotsrealty.com" className="hover:text-slate-900">
                    Email
                  </a>
                </li>
                <li>
                  <a href="tel:+971505555555" className="hover:text-slate-900">
                    Phone
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <Link href="/privacy" className="hover:text-slate-900">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-900">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-slate-600">
            <p>&copy; 2026 DdotsRealty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
