const { mongoose } = require('../db/connection');
const { SEVERITIES } = require('./severities');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  actorId: { type: String, index: true },
  actorRole: { type: String },
  service: { type: String, required: true },
  method: { type: String },
  path: { type: String },
  statusCode: { type: Number },
  ipAddress: { type: String },
  correlationId: { type: String, index: true },
  severity: { type: String, enum: SEVERITIES, default: 'INFO' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function create(data) {
  const doc = await AuditLog.create(data);
  return doc.toObject();
}

async function listPage({ limit, afterId, severity, actorId }) {
  const query = {};
  if (afterId) query._id = { $gt: afterId };
  if (severity) query.severity = severity;
  if (actorId) query.actorId = actorId;
  const docs = await AuditLog.find(query).sort({ _id: 1 }).limit(limit + 1).lean();
  return docs;
}

module.exports = { AuditLog, create, listPage };
