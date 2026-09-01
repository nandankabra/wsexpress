const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

/**
 * Mounts Swagger UI at /api-docs backed by a hand-written openapi.yaml, and serves the
 * raw spec at /api-docs.json / /openapi.yaml for tooling (Postman import, codegen, etc).
 */
function swaggerDocs(app, openapiYamlPath) {
  const spec = YAML.load(openapiYamlPath);
  app.get('/openapi.yaml', (req, res) => res.sendFile(openapiYamlPath));
  app.get('/api-docs.json', (req, res) => res.json(spec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  return spec;
}

module.exports = { swaggerDocs };
