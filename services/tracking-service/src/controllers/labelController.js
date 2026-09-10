const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const trackingEventService = require('../services/trackingEventService');
const { ApiError } = require('@shiptrack/common');

async function generateLabel(req, res, next) {
  try {
    const { trackingId } = req.params;
    
    // Fetch latest event to confirm existence
    const latestEvent = await trackingEventService.latestEvent(trackingId).catch(() => null);
    if (!latestEvent) {
      throw ApiError.notFound('Tracking ID not found');
    }

    // Generate barcode buffer
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128', // Barcode type
      text: trackingId, // Text to encode
      scale: 3, // 3x scaling factor
      height: 10, // Bar height, in millimeters
      includetext: true, // Show human-readable text
      textxalign: 'center', // Always good to set this
    });

    // Create a new PDF document
    const doc = new PDFDocument({
      size: [288, 432], // 4x6 inches label format (72 pts/inch)
      margin: 20
    });

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Label-${trackingId}.pdf`);

    // Pipe PDF directly to response
    doc.pipe(res);

    // Build the PDF
    doc.font('Helvetica-Bold').fontSize(20).text('SHIPTRACK EXPRESS', { align: 'center' });
    doc.moveDown(1);
    
    // Add Barcode image
    doc.image(barcodeBuffer, (doc.page.width - 200) / 2, doc.y, { width: 200 });
    doc.moveDown(4);

    doc.font('Helvetica-Bold').fontSize(12).text('TRACKING ID:', { continued: true });
    doc.font('Helvetica').text(` ${trackingId}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(12).text('DATE:', { continued: true });
    doc.font('Helvetica').text(` ${new Date().toLocaleDateString()}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(12).text('STATUS:', { continued: true });
    doc.font('Helvetica').text(` ${latestEvent.status.replace(/_/g, ' ')}`);
    
    doc.moveDown(3);
    doc.font('Helvetica').fontSize(10).text('Please affix this label securely to your package.', { align: 'center' });

    doc.end();

  } catch (err) {
    next(err);
  }
}

module.exports = { generateLabel };
