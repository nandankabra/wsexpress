const notificationService = require('../services/notificationService');

async function send(req, res, next) {
  try {
    res.status(201).json(await notificationService.sendNotification(req.body));
  } catch (err) {
    next(err);
  }
}

function list(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.status(200).json(notificationService.listHistory(limit));
  } catch (err) {
    next(err);
  }
}

module.exports = { send, list };
