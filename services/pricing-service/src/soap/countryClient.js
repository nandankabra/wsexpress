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
    clientPromise = soap.createClientAsync(wsdlUrl)
      .then((client) => {
        // The WSDL's <soap:address> is a static "http://localhost:8007/..." (baked in at
        // author time - it can't know its own externally-reachable host/port). node-soap uses
        // that address as the actual endpoint for operation calls, not just the URL the WSDL
        // was fetched from, so without this override every real call resolves "localhost"
        // against the *caller's* container instead of location-service and fails with
        // ECONNREFUSED. Point it at the same base URL used to fetch the WSDL.
        client.setEndpoint(`${process.env.LOCATION_SERVICE_URL}/wsdl/country`);
        return client;
      })
      .catch((err) => {
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
