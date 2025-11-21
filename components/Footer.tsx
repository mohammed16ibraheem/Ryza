import Link from 'next/link'
import { FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-white text-xl font-bold mb-4">Ryza</h3>
            <p className="text-sm leading-relaxed">
              Your destination for modest ladies fashion and beautiful accessories. 
              Celebrating Muslim culture with style and grace.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products/dresses" className="hover:text-primary-400 transition-colors">
                  Salah Essential
                </Link>
              </li>
              <li>
                <Link href="/products/hijabs" className="hover:text-primary-400 transition-colors">
                  Hijabs
                </Link>
              </li>
              <li>
                <Link href="/products/gift-hampers" className="hover:text-primary-400 transition-colors">
                  Gift Hampers
                </Link>
              </li>
              <li>
                <Link href="/products/hair-accessories" className="hover:text-primary-400 transition-colors">
                  Hair Essentials
                </Link>
              </li>
              <li>
                <Link href="/products/jewellery" className="hover:text-primary-400 transition-colors">
                  Jewellery
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-primary-400 transition-colors">
                  Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary-400 transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Support */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/ryzathehijabhouse?utm_source=qr&igsh=aDF4c3B6czBubWN1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors touch-manipulation"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors touch-manipulation"
                  aria-label="YouTube"
                >
                  <FaYoutube className="w-5 h-5" />
                </a>
                <a
                  href="https://wa.me/message/5FWC42IHPLBSE1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors touch-manipulation"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-800/40 p-5 space-y-3">
              <h4 className="text-white font-semibold mb-4">Need Support?</h4>
              <p className="text-sm text-gray-400 mb-3">
                Reach our team anytime through Instagram or WhatsApp for quick help.
              </p>
              <div className="flex flex-col space-y-3 text-sm">
                <a
                  href="https://www.instagram.com/ryzathehijabhouse?utm_source=qr&igsh=aDF4c3B6czBubWN1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-gray-200 hover:text-primary-300 transition-colors touch-manipulation min-h-[44px]"
                >
                  <span className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center">
                    <FaInstagram className="w-4 h-4" />
                  </span>
                  <span>@ryzathehijabhouse</span>
                </a>
                <a
                  href="https://wa.me/message/5FWC42IHPLBSE1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-gray-200 hover:text-primary-300 transition-colors touch-manipulation min-h-[44px]"
                >
                  <span className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center">
                    <FaWhatsapp className="w-4 h-4" />
                  </span>
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Ryza. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

