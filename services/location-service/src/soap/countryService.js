const locationModel = require('../models/locationModel');

const service = {
  CountryInfoService: {
    CountryInfoPort: {
      GetCountryInfo(args, callback) {
        locationModel
          .findCountry(String(args.countryCode || ''))
          .then((country) => {
            if (!country) {
              return callback(null, { code: '', name: '', capital: '', currency: '' });
            }
            callback(null, {
              code: country.code,
              name: country.name,
              capital: country.capital,
              currency: country.currency,
            });
          })
          .catch((err) => callback(err));
      },
    },
  },
};

module.exports = { service };
