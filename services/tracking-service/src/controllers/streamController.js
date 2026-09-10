const { EventEmitter } = require('events');
const trackingEventService = require('../services/trackingEventService');

// Create a global event emitter for tracking updates
const trackingEmitter = new EventEmitter();

// Listen for updates and stream to clients
async function streamEvents(req, res, next) {
  const { trackingId } = req.params;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform', // Important: no-transform disables Nginx buffering if it respects headers
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.write('\n'); // Send initial flush

  // Send the current latest event immediately on connect
  try {
    const latest = await trackingEventService.latestEvent(trackingId);
    if (latest) {
      res.write(`data: ${JSON.stringify(latest)}\n\n`);
    }
  } catch (err) {
    // If not found, that's fine, we just wait for the first event
  }

  // Define the listener
  const listener = (eventData) => {
    if (eventData.trackingId === trackingId) {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    }
  };

  // Subscribe
  trackingEmitter.on('new_event', listener);

  // Keep-alive ping every 30 seconds to prevent timeout
  const pingInterval = setInterval(() => {
    res.write(':\n\n'); // SSE comment to keep connection alive
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    trackingEmitter.off('new_event', listener);
    clearInterval(pingInterval);
  });
}

// Function to broadcast new events
function broadcastEvent(eventData) {
  trackingEmitter.emit('new_event', eventData);
}

module.exports = { streamEvents, broadcastEvent };
