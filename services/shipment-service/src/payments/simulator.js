const crypto = require('crypto');
const { ApiError } = require('@shiptrack/common');

// Test-mode strict verification
const IS_TEST_MODE = process.env.PAYMENT_TEST_MODE !== 'false';

// Well-known test scenarios
const TEST_CARDS = {
  // Successful test card (Visa)
  '4242424242424242': { outcome: 'SUCCESS', brand: 'VISA' },
  // Successful test card (Mastercard)
  '5555555555554444': { outcome: 'SUCCESS', brand: 'MASTERCARD' },
  // Declined card
  '4000000000000002': { outcome: 'FAILED', code: 'CARD_DECLINED', message: 'Card declined by issuing bank (test scenario)' },
  // Insufficient funds
  '4000000000000003': { outcome: 'FAILED', code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds on test card' },
  // Expired card
  '4000000000000004': { outcome: 'FAILED', code: 'EXPIRED_CARD', message: 'Test card has expired' },
};

const TEST_UPI_HANDLES = {
  'success@shiptrack': { outcome: 'SUCCESS' },
  'test@upi': { outcome: 'SUCCESS' },
  'pay@okhdfcbank': { outcome: 'SUCCESS' },
  'decline@shiptrack': { outcome: 'FAILED', code: 'UPI_COLLECT_REJECTED', message: 'UPI collect request rejected by user' },
  'timeout@shiptrack': { outcome: 'FAILED', code: 'UPI_TIMEOUT', message: 'UPI payment attempt timed out' },
};

/**
 * Validates and simulates payment processing in testing mode only.
 * Guaranteed never to move real money or contact live financial gateways.
 */
async function simulatePayment({ method, details = {}, amount, currency, orderId }) {
  // 1. Strict Test Mode Assertion
  if (!IS_TEST_MODE) {
    throw ApiError.forbidden('Live payments are disabled. The application operates strictly in test simulation mode.');
  }
  if (process.env.LIVE_PAYMENT_GATEWAY_URL || process.env.RAZORPAY_LIVE_SECRET || process.env.STRIPE_LIVE_KEY) {
    throw ApiError.internal('Security violation: live payment credentials detected in test simulation mode.');
  }

  const validMethods = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET'];
  const normMethod = (method || '').toUpperCase();
  if (!validMethods.includes(normMethod)) {
    throw ApiError.badRequest(`Unsupported payment method. Supported methods: ${validMethods.join(', ')}`);
  }

  const paymentReference = `SIM-PAY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  let outcome = 'SUCCESS';
  let failureCode = null;
  let errorMessage = null;
  let sanitizedMetadata = {
    method: normMethod,
    simulatedAt: new Date().toISOString(),
    testMode: true,
  };

  // 2. Method-Specific Simulation Logic
  if (normMethod === 'CREDIT_CARD' || normMethod === 'DEBIT_CARD') {
    const rawCardNumber = (details.cardNumber || '').replace(/[\s-]/g, '');
    if (!rawCardNumber || rawCardNumber.length < 12 || rawCardNumber.length > 19) {
      throw ApiError.badRequest('Invalid card number. Please provide a valid test card number.');
    }

    const last4 = rawCardNumber.slice(-4);
    sanitizedMetadata.cardLast4 = last4;
    sanitizedMetadata.cardBrand = rawCardNumber.startsWith('4') ? 'VISA' : rawCardNumber.startsWith('5') ? 'MASTERCARD' : 'RUPAY';
    sanitizedMetadata.cardExpiry = details.expiryMonth && details.expiryYear ? `${details.expiryMonth}/${details.expiryYear}` : '12/28';

    const cardRule = TEST_CARDS[rawCardNumber];
    if (cardRule && cardRule.outcome === 'FAILED') {
      outcome = 'FAILED';
      failureCode = cardRule.code;
      errorMessage = cardRule.message;
    } else if (details.simulateFailure) {
      outcome = 'FAILED';
      failureCode = 'TEST_SIMULATED_DECLINE';
      errorMessage = 'Payment declined due to simulated failure flag';
    }
  } else if (normMethod === 'UPI') {
    const upiId = (details.upiId || '').trim().toLowerCase();
    if (!upiId || !upiId.includes('@')) {
      throw ApiError.badRequest('Invalid UPI ID. Format should be username@bank (e.g. success@shiptrack or test@upi)');
    }
    sanitizedMetadata.upiIdMasked = upiId.replace(/(.).+(@.+)/, '$1***$2');

    const upiRule = TEST_UPI_HANDLES[upiId];
    if (upiRule && upiRule.outcome === 'FAILED') {
      outcome = 'FAILED';
      failureCode = upiRule.code;
      errorMessage = upiRule.message;
    } else if (details.simulateFailure) {
      outcome = 'FAILED';
      failureCode = 'UPI_TRANSACTION_FAILED';
      errorMessage = 'Simulated UPI transfer failure';
    }
  } else if (normMethod === 'NET_BANKING') {
    const bankCode = (details.bankCode || 'HDFC').toUpperCase();
    sanitizedMetadata.bankCode = bankCode;

    if (details.simulateFailure || bankCode === 'FAIL_BANK') {
      outcome = 'FAILED';
      failureCode = 'NET_BANKING_AUTH_FAILED';
      errorMessage = 'Net banking authentication failed or was cancelled by user';
    }
  } else if (normMethod === 'WALLET') {
    const walletProvider = (details.walletProvider || 'PAYTM').toUpperCase();
    sanitizedMetadata.walletProvider = walletProvider;

    if (details.simulateFailure) {
      outcome = 'FAILED';
      failureCode = 'WALLET_BALANCE_INSUFFICIENT';
      errorMessage = 'Simulated digital wallet failure';
    }
  }

  // Artificial processing latency simulation (50ms)
  await new Promise((resolve) => setTimeout(resolve, 50));

  return {
    paymentReference,
    provider: 'TEST_SIMULATOR',
    paymentMethod: normMethod,
    amount: Number(amount),
    currency: currency || 'INR',
    status: outcome,
    testMode: true,
    failureCode,
    errorMessage,
    metadata: sanitizedMetadata,
  };
}

module.exports = {
  simulatePayment,
  IS_TEST_MODE,
  TEST_CARDS,
  TEST_UPI_HANDLES,
};
