const registerSchema = {
  type: 'object',
  required: ['name', 'email', 'password'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 120 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8, maxLength: 72 },
  },
};

const adminCreateAccountSchema = {
  type: 'object',
  required: ['name', 'email', 'password', 'role'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 120 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8, maxLength: 72 },
    role: { type: 'string', enum: ['CARRIER', 'ADMIN'] },
  },
};

const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 },
  },
};

const refreshSchema = {
  type: 'object',
  required: ['refreshToken'],
  additionalProperties: false,
  properties: {
    refreshToken: { type: 'string', minLength: 10 },
  },
};

module.exports = { registerSchema, adminCreateAccountSchema, loginSchema, refreshSchema };
