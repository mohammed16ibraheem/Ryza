declare module '@cashfreepayments/cashfree-js' {
  export interface Cashfree {
    checkout(options: {
      paymentSessionId: string
      redirectTarget?: '_self' | '_blank' | '_top' | '_modal' | HTMLElement
    }): void | Promise<void>
  }

  export interface LoadOptions {
    mode: 'sandbox' | 'production'
  }

  export function load(options: LoadOptions): Promise<Cashfree | null>
}

