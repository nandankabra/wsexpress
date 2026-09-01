const auditService = require('../services/auditService');

async function recordLog(req, res, next) {
  try {
    const entry = {
      ...req.body,
      correlationId: req.body.correlationId || req.correlationId,
      ipAddress: req.body.ipAddress || req.ip,
    };
    res.status(201).json(await auditService.recordLog(entry));
  } catch (err) {
    next(err);
  }
}

async function listLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await auditService.listLogs({
      cursor: req.query.cursor,
      limit,
      severity: req.query.severity,
      actorId: req.query.actorId,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { recordLog, listLogs };
