import Link from 'next/link'
import { FiArrowRight, FiHeart, FiStar, FiShield } from 'react-icons/fi'

export default function AboutPage() {
  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider bg-pink-100 px-4 py-2 rounded-full">
              Our Story
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            About <span className="text-primary-600">Ryza</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto">
            The Hijab House
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-16 mb-12 border border-pink-100">
          <div className="space-y-8">
            {/* Opening Story */}
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full"></div>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed pl-8 font-light">
                At <span className="font-semibold text-primary-600">Ryza - The Hijab House</span>, our journey began with a simple yet powerful vision: 
                to make modest fashion <span className="font-medium text-pink-600">elegant</span>, <span className="font-medium text-purple-600">comfortable</span>, and <span className="font-medium text-primary-600">accessible</span> for every woman.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-primary-400 rounded-full"></div>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed pl-8 font-light">
                We believe that a hijab is more than just a piece of fabric - it is an expression 
                of <span className="font-semibold text-pink-600">identity</span>, <span className="font-semibold text-purple-600">confidence</span>, and <span className="font-semibold text-primary-600">grace</span>. With this belief at our core, Ryza was created 
                to offer a complete and premium hijab experience that celebrates the beauty of 
                modesty while embracing contemporary style.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-pink-100">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FiHeart className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our mission is to empower every woman to express her unique sense of style while 
                staying true to her values. We curate collections that blend contemporary fashion 
                with timeless modesty, ensuring that every piece we offer is not just beautiful, 
                but also meaningful.
              </p>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-12 mb-12 border border-purple-100">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { text: 'Premium hijabs in luxurious fabrics including cotton, jersey, and luxury materials' },
              { text: 'Hijab essentials and accessories to complete your modest wardrobe' },
              { text: 'Modest dresses designed for comfort, elegance, and style' },
              { text: 'Beautiful gift hampers perfect for special occasions' },
              { text: 'Hair essentials and jewellery to complement your look' },
            ].map((item, index) => (
              <div key={index} className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl hover:shadow-lg transition-all duration-300 border border-pink-100">
                <p className="text-gray-700 leading-relaxed font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl p-8 text-center border border-pink-200 shadow-lg">
            <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiStar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Quality</h3>
            <p className="text-gray-700">We source the finest materials to ensure every product meets our high standards</p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-8 text-center border border-purple-200 shadow-lg">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiShield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Authenticity</h3>
            <p className="text-gray-700">Genuine products crafted with care and respect for tradition</p>
          </div>
          <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl p-8 text-center border border-primary-200 shadow-lg">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiHeart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Satisfaction</h3>
            <p className="text-gray-700">Your happiness is our priority - we're here to serve you with love</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative bg-gradient-to-br from-pink-400 to-pink-500 rounded-3xl shadow-2xl p-8 md:p-12 text-center text-white overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-300/50 via-pink-400/30 to-pink-600/50 blur-3xl animate-pulse"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-pink-300/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-400/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">Ready to Explore?</h2>
            <p className="text-lg md:text-xl mb-8 opacity-95 drop-shadow-md">
              Discover our beautiful collection of modest fashion and accessories
            </p>
            <Link
              href="/products"
              className="inline-flex items-center bg-white text-pink-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-pink-50 hover:text-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Explore Our Collection
              <FiArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}

