process.env.LOCATION_SERVICE_URL = 'http://location-service:8007';

const mockClient = {
  setEndpoint: jest.fn(),
  GetCountryInfoAsync: jest.fn().mockResolvedValue([{ code: 'IN', name: 'India', capital: 'New Delhi', currency: 'INR' }]),
};

jest.mock('soap', () => ({
  createClientAsync: jest.fn().mockResolvedValue(mockClient),
}));

const { getCountryInfo } = require('../src/soap/countryClient');

describe('countryClient (SOAP client to location-service)', () => {
  test('overrides the WSDL\'s baked-in endpoint with the configured location-service URL', async () => {
    await getCountryInfo('IN');
    // The WSDL's <soap:address> is a static "http://localhost:8007/..." which is wrong from
    // any other container's perspective - the client must override it or every real call
    // resolves "localhost" against itself instead of location-service.
    expect(mockClient.setEndpoint).toHaveBeenCalledWith('http://location-service:8007/wsdl/country');
  });

  test('returns the resolved country info', async () => {
    const result = await getCountryInfo('IN');
    expect(result).toEqual({ code: 'IN', name: 'India', capital: 'New Delhi', currency: 'INR' });
  });
});
