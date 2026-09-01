const soap = require('soap');
const { WSDL } = require('./currencyWsdl');
const { service } = require('./currencyService');

function mountCurrencySoapService(httpServer) {
  soap.listen(httpServer, '/wsdl/currency', service, WSDL);
}

module.exports = { mountCurrencySoapService };
