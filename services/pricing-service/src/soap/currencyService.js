const pricingService = require('../services/pricingService');

const service = {
  CurrencyConversionService: {
    CurrencyConversionPort: {
      ConvertCurrency(args, callback) {
        const amount = Number(args.amount);
        const fromCurrency = String(args.fromCurrency || '').toUpperCase();
        const toCurrency = String(args.toCurrency || '').toUpperCase();

        pricingService
          .convertCurrency(amount, fromCurrency, toCurrency)
          .then((convertedAmount) => callback(null, { convertedAmount, fromCurrency, toCurrency }))
          .catch((err) => callback(err));
      },
    },
  },
};

module.exports = { service };
