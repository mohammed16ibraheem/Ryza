import { Metadata } from 'next'
import { productsMetadata } from '../metadata'

export const metadata: Metadata = productsMetadata

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

