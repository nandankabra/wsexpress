jest.mock('../src/models/locationModel');

const locationModel = require('../src/models/locationModel');
const { service } = require('../src/soap/countryService');

describe('SOAP CountryInfoService.GetCountryInfo', () => {
  test('returns country details for a known code', (done) => {
    locationModel.findCountry.mockResolvedValue({
      code: 'US', name: 'United States', capital: 'Washington, D.C.', currency: 'USD',
    });

    service.CountryInfoService.CountryInfoPort.GetCountryInfo({ countryCode: 'US' }, (err, result) => {
      expect(err).toBeNull();
      expect(result).toEqual({
        code: 'US', name: 'United States', capital: 'Washington, D.C.', currency: 'USD',
      });
      done();
    });
  });

  test('returns empty fields for an unknown code', (done) => {
    locationModel.findCountry.mockResolvedValue(null);

    service.CountryInfoService.CountryInfoPort.GetCountryInfo({ countryCode: 'ZZ' }, (err, result) => {
      expect(err).toBeNull();
      expect(result.code).toBe('');
      done();
    });
  });
});
