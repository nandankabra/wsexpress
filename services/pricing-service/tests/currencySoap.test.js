jest.mock('../src/models/pricingModel');

const pricingModel = require('../src/models/pricingModel');
const { service } = require('../src/soap/currencyService');

describe('SOAP CurrencyConversionService.ConvertCurrency', () => {
  test('converts between two known currencies', (done) => {
    pricingModel.findRate.mockImplementation((currency) => {
      if (currency === 'USD') return Promise.resolve({ currency: 'USD', rate_to_usd: '1.000000' });
      if (currency === 'INR') return Promise.resolve({ currency: 'INR', rate_to_usd: '0.012000' });
      return Promise.resolve(null);
    });

    service.CurrencyConversionService.CurrencyConversionPort.ConvertCurrency(
      { amount: 12, fromCurrency: 'USD', toCurrency: 'INR' },
      (err, result) => {
        expect(err).toBeNull();
        expect(result.convertedAmount).toBe(1000);
        expect(result.toCurrency).toBe('INR');
        done();
      },
    );
  });

  test('passes an error to the callback for an unknown currency', (done) => {
    pricingModel.findRate.mockResolvedValue(null);

    service.CurrencyConversionService.CurrencyConversionPort.ConvertCurrency(
      { amount: 12, fromCurrency: 'USD', toCurrency: 'ZZZ' },
      (err) => {
        expect(err).toBeDefined();
        done();
      },
    );
  });
});
