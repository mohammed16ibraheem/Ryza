/**
 * Cashfree Error Handler
 * Maps technical error codes to user-friendly messages
 * Logs detailed errors for developers
 */

export interface CashfreeError {
  error_code?: string
  error_description?: string
  error_source?: string
  error_reason?: string
  code?: string
  type?: string
  message?: string
  help?: string
}

/**
 * Maps Cashfree error codes to user-friendly messages
 */
const ERROR_MESSAGE_MAP: { [key: string]: string } = {
  // Payment method errors
  card_unsupported: 'This card type is not supported. Please use a different card.',
  payment_method_unsupported: 'This payment method is not available. Please try another option.',
  payment_gateway_unsupported: 'Payment gateway is temporarily unavailable. Please try again later.',
  card_submission_disabled: 'Card payments are temporarily disabled. Please use another payment method.',
  
  // Order errors
  order_amount_invalid: 'Order amount is invalid. Please refresh and try again.',
  order_inactive: 'This order has expired. Please create a new order.',
  order_id_invalid: 'Order information is invalid. Please try again.',
  order_expiry_time_invalid: 'Order has expired. Please create a new order.',
  order_id_not_paid: 'Payment was not completed. Please try again.',
  order_id_voided: 'This order cannot be processed. Please create a new order.',
  order_already_paid: 'This order has already been paid.',
  order_already_exists: 'Order already exists. Please check your order status.',
  order_not_found: 'Order not found. Please try again.',
  
  // Customer errors
  customer_email_invalid: 'Email address is invalid. Please check and try again.',
  customer_phone_invalid: 'Phone number is invalid. Please enter a valid 10-digit number.',
  
  // Session/Token errors
  order_token_invalid: 'Session expired. Please refresh and try again.',
  payment_session_id_invalid: 'Payment session expired. Please try again.',
  cookie_invalid: 'Session expired. Please refresh the page.',
  
  // Payment processing errors
  bank_processing_failure: 'Bank is unable to process the payment. Please try again or use another payment method.',
  payment_amount_invalid: 'Payment amount is invalid. Please try again.',
  payment_method_invalid: 'Selected payment method is invalid. Please choose another option.',
  payment_gateway_inactive: 'Payment gateway is temporarily unavailable. Please try again later.',
  
  // Refund errors (for future use)
  refund_amount_invalid: 'Refund amount is invalid.',
  refund_unsupported: 'Refund is not available for this payment.',
  
  // Network/API errors
  api_connection_error: 'Connection error. Please check your internet and try again.',
  api_error: 'Payment service is temporarily unavailable. Please try again in a moment.',
  api_request_timeout: 'Request timed out. Please try again.',
  request_failed: 'Payment request failed. Please try again.',
  
  // Authentication errors
  authentication_error: 'Authentication failed. Please contact support.',
  partner_apikey_invalid: 'Service configuration error. Please contact support.',
  
  // Rate limiting
  rate_limit_error: 'Too many requests. Please wait a moment and try again.',
  
  // Validation errors
  validation_error: 'Invalid information provided. Please check and try again.',
  
  // General errors
  invalid_request_error: 'Invalid request. Please refresh and try again.',
  feature_not_enabled: 'This feature is not available. Please contact support.',
  bad_gateway_error: 'Service temporarily unavailable. Please try again later.',
}

/**
 * Get user-friendly error message from Cashfree error
 */
export function getUserFriendlyError(error: CashfreeError | any): string {
  // Check for error_code first (webhook format)
  if (error?.error_code) {
    const message = ERROR_MESSAGE_MAP[error.error_code]
    if (message) return message
  }
  
  // Check for code (API format)
  if (error?.code) {
    const message = ERROR_MESSAGE_MAP[error.code]
    if (message) return message
  }
  
  // Check for type
  if (error?.type === 'rate_limit_error') {
    return ERROR_MESSAGE_MAP.rate_limit_error
  }
  
  // Check error message for common patterns
  if (error?.message) {
    const lowerMessage = error.message.toLowerCase()
    
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
      return ERROR_MESSAGE_MAP.rate_limit_error
    }
    if (lowerMessage.includes('timeout')) {
      return ERROR_MESSAGE_MAP.api_request_timeout
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return ERROR_MESSAGE_MAP.api_connection_error
    }
    if (lowerMessage.includes('expired') || lowerMessage.includes('invalid session')) {
      return 'Session expired. Please refresh and try again.'
    }
  }
  
  // Default user-friendly message
  return 'Payment processing failed. Please try again or use a different payment method.'
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: CashfreeError | any): boolean {
  if (error?.type === 'rate_limit_error') return true
  if (error?.code === 'rate_limit_error') return true
  if (error?.error_code === 'rate_limit_error') return true
  if (error?.status === 429) return true
  if (error?.response?.status === 429) return true
  
  const message = error?.message?.toLowerCase() || ''
  return message.includes('rate limit') || message.includes('too many requests')
}

/**
 * Extract retry time from error
 */
export function getRetryAfter(error: CashfreeError | any): number {
  // Check headers first
  if (error?.response?.headers?.['x-ratelimit-retry']) {
    return parseInt(error.response.headers['x-ratelimit-retry'])
  }
  if (error?.headers?.['x-ratelimit-retry']) {
    return parseInt(error.headers['x-ratelimit-retry'])
  }
  
  // Default retry time
  return 60
}

/**
 * Log detailed error for developers
 */
export function logErrorForDevelopers(error: CashfreeError | any, context: string) {
  const errorDetails = {
    context,
    timestamp: new Date().toISOString(),
    error_code: error?.error_code || error?.code,
    error_type: error?.type,
    error_description: error?.error_description || error?.message,
    error_source: error?.error_source,
    error_reason: error?.error_reason,
    status: error?.status || error?.response?.status,
    help: error?.help,
    fullError: error,
  }
  
  // Log to console for developers (only in development or for debugging)
  console.error('[Cashfree Error]', JSON.stringify(errorDetails, null, 2))
  
  return errorDetails
}

/**
 * Extract error information from Cashfree response
 */
export function extractCashfreeError(error: any): CashfreeError {
  // Handle different error formats
  if (error?.response?.data) {
    return error.response.data
  }
  if (error?.data) {
    return error.data
  }
  if (error?.error_details) {
    return error.error_details
  }
  
  // Fallback to error object itself
  return error
}

