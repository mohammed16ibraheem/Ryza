import { Metadata } from 'next'
import { productsMetadata } from '../../metadata'

const categoryKeywords: { [key: string]: string[] } = {
  'salah-essential': [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'salah essential',
    'modest dress hyderabad',
    'best quality dress',
    'muslim dress hyderabad',
    'modest clothing',
  ],
  'hijabs': [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'hijab',
    'hijab hyderabad',
    'best quality hijab',
    'luxury hijab',
    'hijab essentials',
    'muslim hijab',
  ],
  'gift-hampers': [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'gift hampers',
    'gift hampers hyderabad',
    'muslim gift hampers',
    'best quality gift hampers',
  ],
  'hair-essentials': [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'hair essentials',
    'hair accessories',
    'muslim hair accessories hyderabad',
  ],
  'jewellery': [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'jewellery',
    'muslim jewellery hyderabad',
    'modest jewellery',
  ],
  'offers': [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    'offers',
    'discount hijab',
    'sale muslim fashion',
  ],
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const category = params.category
  const categoryName = category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  const keywords = categoryKeywords[category] || [
    'hyderabad',
    'dress',
    'best quality',
    'muslim',
    categoryName.toLowerCase(),
  ]

  return {
    ...productsMetadata,
    title: `${categoryName} - Best Quality Muslim Fashion in Hyderabad | Ryza`,
    description: `Shop best quality ${categoryName.toLowerCase()} in Hyderabad. Premium quality Muslim fashion and modest clothing.`,
    keywords: keywords,
    openGraph: {
      ...productsMetadata.openGraph,
      title: `${categoryName} - Best Quality Muslim Fashion in Hyderabad`,
      description: `Shop best quality ${categoryName.toLowerCase()} in Hyderabad. Premium quality Muslim fashion.`,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://theryza.com'}/products/${category}`,
    },
  }
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

