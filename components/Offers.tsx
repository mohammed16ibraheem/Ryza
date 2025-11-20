const offers = [
  {
    title: 'Festive Combo',
    description: 'Any silk hijab + hair accessory set',
    offer: 'Save 20%',
    price: '₹3,499',
    background: 'from-primary-100 to-white',
  },
  {
    title: 'Wedding Gift Hamper',
    description: 'Customized hamper with floral decor + premium wrapping',
    offer: 'Free shipping',
    price: '₹5,999',
    background: 'from-white to-primary-50',
  },
  {
    title: 'Hijab Styling Session',
    description: '1-on-1 styling tips with our in-house stylist',
    offer: 'Complimentary with orders above ₹7,000',
    price: 'Limited slots',
    background: 'from-white to-primary-100',
  },
]

export default function Offers() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-[0.3em] text-primary-600 uppercase">Special Offers</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Exclusive Deals & Combos</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Limited-time promotions crafted for celebrations, gifting, and wardrobe refreshes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offerCard) => {
            const showPriceStyling = offerCard.price.includes('₹')
            return (
              <div
                key={offerCard.title}
                className={`rounded-3xl border border-gray-100 shadow-lg p-6 bg-gradient-to-b ${offerCard.background}`}
              >
                <p className="inline-flex items-center px-4 py-1 text-sm font-semibold bg-primary-600 text-white rounded-full mb-4">
                  {offerCard.offer}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{offerCard.title}</h3>
                <p className="text-gray-600 mb-4">{offerCard.description}</p>
                <p className={`text-lg font-semibold text-gray-900 ${showPriceStyling ? 'price-text' : ''}`}>
                  {offerCard.price}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

