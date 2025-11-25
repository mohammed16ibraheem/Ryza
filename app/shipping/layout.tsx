import { Metadata } from 'next'
import { shippingMetadata } from '../metadata'

export const metadata: Metadata = shippingMetadata

export default function ShippingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

