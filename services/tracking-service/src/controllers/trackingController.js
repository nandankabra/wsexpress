const trackingEventService = require('../services/trackingEventService');
const { broadcastEvent } = require('./streamController');

async function recordEvent(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { status, location, lat, lng, note, hubId, scannerId, barcodeData } = req.body;
    let recordedBy = 'SYSTEM';
    if (req.user) {
      recordedBy = req.user.role === 'CARRIER' || req.user.role === 'HUB_STAFF' 
        ? `${req.user.role}_${req.user.sub.slice(0, 8)}` 
        : req.user.sub;
    }

    const event = await trackingEventService.recordEvent({
      trackingId,
      status,
      location,
      lat,
      lng,
      note,
      recordedBy,
      hubId,
      scannerId,
      barcodeData
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
