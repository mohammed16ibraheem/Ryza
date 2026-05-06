export default function ReturnsPage() {
  return (
    <div className="pt-20 md:pt-24 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Returns & Refund Policy
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Please read our policy carefully before making a purchase
          </p>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8">
          {/* No Returns Section */}
          <div className="border-l-4 border-primary-600 pl-4 md:pl-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              No Returns Policy
            </h2>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
              At <strong className="ryza-brand">Ryza</strong>, we maintain a strict <strong>no returns, no refunds, and no exchanges</strong> policy on all products. 
              All sales are considered final once the order has been placed and confirmed.
            </p>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              We carefully curate and quality-check every product before shipping to ensure you receive items in perfect condition. 
              By placing an order with us, you acknowledge and agree to this policy.
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 md:p-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-red-900 mb-3">
                  Important Legal Notice
                </h3>
                <p className="text-red-800 text-base md:text-lg leading-relaxed mb-4">
                  <strong>Fraudulent chargebacks and unauthorized refund attempts are strictly prohibited.</strong> 
                  Any attempt to initiate a chargeback, dispute a legitimate transaction, or request an unauthorized refund 
                  through payment processors or financial institutions will be considered fraudulent activity.
                </p>
                <p className="text-red-800 text-base md:text-lg leading-relaxed font-semibold">
                  We reserve the right to take appropriate legal action against individuals who engage in such fraudulent activities, 
                  including but not limited to filing police reports, pursuing civil litigation, and reporting to relevant authorities 
                  and credit bureaus.
                </p>
              </div>
            </div>
          </div>

          {/* Before You Order */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">
              Before You Place Your Order
            </h3>
            <ul className="space-y-3 text-blue-800 text-base md:text-lg">
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">✓</span>
                <span>Please review product descriptions, images, and specifications carefully</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">✓</span>
                <span>Check sizing information if applicable</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">✓</span>
                <span>Ensure your shipping address is correct</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">✓</span>
                <span>Contact us via Instagram or WhatsApp if you have any questions before ordering</span>
              </li>
            </ul>
          </div>

          {/* Defective Products */}
          <div className="border-t border-gray-200 pt-6 md:pt-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              Defective or Damaged Products
            </h3>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
              In the rare event that you receive a product that is defective or damaged due to our error, 
              please contact us immediately within 48 hours of delivery through our official channels:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-primary-600 font-semibold">Instagram:</span>
                <a 
                  href="https://www.instagram.com/ryzathehijabhouse?utm_source=qr&igsh=aDF4c3B6czBubWN1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  @ryzathehijabhouse
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-primary-600 font-semibold">WhatsApp:</span>
                <a 
                  href="https://wa.me/message/5FWC42IHPLBSE1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Chat with us
                </a>
              </div>
            </div>
            <p className="text-gray-700 text-base md:text-lg leading-relaxed mt-4">
              We will review your case and may offer a replacement or store credit at our sole discretion. 
              This exception applies only to genuine manufacturing defects or shipping damage, not to buyer's remorse, 
              incorrect sizing choices, or change of mind.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-primary-900 mb-3">
              Questions About Our Policy?
            </h3>
            <p className="text-primary-800 text-base md:text-lg mb-4">
              If you have any questions or concerns about our returns policy, please reach out to us before placing your order. 
              We're here to help ensure you make the right choice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.instagram.com/ryzathehijabhouse?utm_source=qr&igsh=aDF4c3B6czBubWN1"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Contact on Instagram
              </a>
              <a
                href="https://wa.me/message/5FWC42IHPLBSE1"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

