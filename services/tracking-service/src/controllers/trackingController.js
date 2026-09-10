const trackingEventService = require('../services/trackingEventService');
const { broadcastEvent } = require('./streamController');

async function recordEvent(req, res, next) {
  try {
    const recordedBy = req.user ? req.user.sub : 'system';
    const event = await trackingEventService.recordEvent({
      trackingId: req.params.trackingId,
      status: req.body.status,
      location: req.body.location,
      lat: req.body.lat,
      lng: req.body.lng,
      note: req.body.note,
      recordedBy,
    });
    
    // Broadcast event to active SSE clients
    broadcastEvent(event);
    
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await trackingEventService.listEvents(req.params.trackingId, {
      cursor: req.query.cursor,
      limit,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function latest(req, res, next) {
  try {
    res.status(200).json(await trackingEventService.latestEvent(req.params.trackingId));
  } catch (err) {
    next(err);
  }
}

module.exports = { recordEvent, listEvents, latest };
