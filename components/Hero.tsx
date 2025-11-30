import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative mt-16 md:mt-20 h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] bg-primary-100 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="text-center md:text-left max-w-2xl px-4 sm:px-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-primary-800">
            Modest Fashion for
            <span className="block text-primary-600">Modern Women</span>
          </h1>
          <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
            <p className="text-lg sm:text-xl md:text-2xl text-gray-800 font-semibold italic leading-relaxed">
              Modesty isn't about hiding; it's about choosing to shine with grace.
            </p>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
              Discover the beauty of elegant hijabs and timeless modest fashion through a collection crafted for comfort, confidence, and style.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 bg-white/40 border-2 border-primary-600 text-primary-800 rounded-full font-semibold hover:bg-white/50 transition-all touch-manipulation min-h-[44px]"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}

