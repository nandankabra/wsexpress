const soap = require('soap');
const { WSDL } = require('./countryWsdl');
const { service } = require('./countryService');

/**
 * SOAP must be mounted on the raw http.Server (what app.listen() returns), not on the
 * Express app itself - node-soap hooks the server's 'request' event directly.
 */
function mountCountrySoapService(httpServer) {
  soap.listen(httpServer, '/wsdl/country', service, WSDL);
}

module.exports = { mountCountrySoapService };
