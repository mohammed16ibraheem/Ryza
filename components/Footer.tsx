import Link from 'next/link'
import { FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {/* About */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="ryza-brand text-white text-lg sm:text-xl mb-3 sm:mb-4">Ryza</h3>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-400">
              Your destination for modest ladies fashion and beautiful accessories. 
              Celebrating Muslim culture with style and grace.
            </p>
            
            {/* App Store & Play Store Coming Soon */}
            <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
              <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 sm:mb-3">
                Mobile App Coming Soon
              </p>
              <div className="flex flex-col space-y-2 sm:space-y-2.5">
                {/* App Store */}
                <div className="relative group">
                  <div className="flex items-center space-x-2.5 sm:space-x-3 bg-gradient-to-r from-gray-800/80 to-gray-800/60 rounded-lg p-2 sm:p-2.5 border border-gray-700/50 hover:border-primary-500/50 transition-all cursor-not-allowed">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.75 15.25 4.41 7.59 9.17 7.31c1.06.07 1.83.67 2.79.64 1.09-.03 1.78-.59 2.79-.64 1.51-.12 2.65.54 3.64 1.31-3.12 1.76-4.65 5.42-3.9 9.23.5 2.48 1.87 3.71 3.39 4.4.38.17.64.14.88-.01M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] sm:text-[9px] text-gray-400 leading-tight font-medium">Download on the</p>
                      <p className="text-[10px] sm:text-xs font-bold text-white leading-tight tracking-tight">App Store</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold bg-primary-600/20 text-primary-400 border border-primary-500/30">
                        Soon
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Play Store */}
                <div className="relative group">
                  <div className="flex items-center space-x-2.5 sm:space-x-3 bg-gradient-to-r from-gray-800/80 to-gray-800/60 rounded-lg p-2 sm:p-2.5 border border-gray-700/50 hover:border-primary-500/50 transition-all cursor-not-allowed">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] sm:text-[9px] text-gray-400 leading-tight font-medium">Get it on</p>
                      <p className="text-[10px] sm:text-xs font-bold text-white leading-tight tracking-tight">Google Play</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold bg-primary-600/20 text-primary-400 border border-primary-500/30">
                        Soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
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
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">Customer Service</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
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
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">Follow Us</h4>
              <div className="flex space-x-3 sm:space-x-4">
                <a
                  href="https://www.instagram.com/ryzathehijabhouse?utm_source=qr&igsh=aDF4c3B6czBubWN1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors touch-manipulation"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors touch-manipulation"
                  aria-label="YouTube"
                >
                  <FaYoutube className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
                <a
                  href="https://wa.me/message/5FWC42IHPLBSE1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors touch-manipulation"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-gray-800/40 p-4 sm:p-5 space-y-2.5 sm:space-y-3">
              <h4 className="text-white text-base sm:text-lg font-semibold mb-3 sm:mb-4">Need Support?</h4>
              <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 leading-relaxed">
                Reach our team anytime through Instagram or WhatsApp for quick help.
              </p>
              <div className="flex flex-col space-y-2 sm:space-y-3 text-xs sm:text-sm">
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

        <div className="border-t border-gray-800 mt-6 sm:mt-8 lg:mt-10 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
          <p>&copy; {new Date().getFullYear()} <span className="ryza-brand">Ryza</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

