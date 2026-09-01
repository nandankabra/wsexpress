const soap = require('soap');

let clientPromise = null;

/**
 * Lazily reads location-service's WSDL and caches the generated SOAP client. If creation
 * fails (e.g. location-service isn't up yet), the cache is cleared so the next call retries
 * instead of being stuck with a rejected promise forever.
 */
function getClient() {
  if (!clientPromise) {
    const wsdlUrl = `${process.env.LOCATION_SERVICE_URL}/wsdl/country?wsdl`;
    clientPromise = soap.createClientAsync(wsdlUrl).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

/**
 * Performs a real SOAP request against location-service's CountryInfoService.
 * Returns { code, name, capital, currency }, or null if the country is unknown
 * or the SOAP call could not complete (caller decides how to degrade).
 */
async function getCountryInfo(countryCode) {
  const client = await getClient();
  const [result] = await client.GetCountryInfoAsync({ countryCode });
  if (!result || !result.code) return null;
  return result;
}

module.exports = { getCountryInfo };
