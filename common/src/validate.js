const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { ApiError } = require('./errors');

const ajv = new Ajv({ allErrors: true, coerceTypes: true, removeAdditional: false });
addFormats(ajv);

/**
 * Express middleware factory: validates req[part] (default 'body') against an AJV JSON Schema.
 */
function validate(schema, part = 'body') {
  const validateFn = ajv.compile(schema);
  return (req, res, next) => {
    const valid = validateFn(req[part]);
    if (!valid) {
      const details = validateFn.errors.map((e) => ({
        field: e.instancePath || e.params?.missingProperty || '(root)',
        message: e.message,
      }));
      return next(ApiError.badRequest('Request validation failed', details));
    }
    next();
  };
}

module.exports = { validate, ajv };
