const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const shipmentService = require('../services/shipmentService');
const { ApiError } = require('@shiptrack/common');

async function getLabel(req, res, next) {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.getShipmentForActor(id, req.user);
    if (!shipment) throw ApiError.notFound('Shipment not found');

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: shipment.trackingId,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });

    const doc = new PDFDocument({ size: [288, 432], margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Label-${shipment.trackingId}.pdf`);
    doc.pipe(res);

    // Title / Carrier Box
    doc.font('Helvetica-Bold').fontSize(16).text('SHIPTRACK V2 LOGISTICS', { align: 'center' });
    doc.moveDown(0.5);

    doc.rect(20, 45, 248, 30).stroke();
    doc.font('Helvetica-Bold').fontSize(14).text(`${shipment.serviceType || 'STANDARD'}`, 25, 52, { align: 'center', width: 238 });

    // Routing Zone
    doc.rect(20, 80, 248, 40).stroke();
    doc.fontSize(16).text(`${(shipment.origin.city || 'ORG').substring(0,3).toUpperCase()} -> ${(shipment.destination.city || 'DST').substring(0,3).toUpperCase()}`, 25, 90, { align: 'center', width: 238 });

    doc.moveDown(1);

    // Addresses
    doc.font('Helvetica-Bold').fontSize(10).text('FROM:');
    doc.font('Helvetica').fontSize(9).text(`${shipment.origin.address}, ${shipment.origin.city}, ${shipment.origin.country}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(10).text('TO:');
    doc.font('Helvetica').fontSize(9).text(`${shipment.destination.address}, ${shipment.destination.city}, ${shipment.destination.country}`);
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text(`Weight: ${shipment.weightKg} kg | Dims: ${shipment.dimensionsCm?.length||0}x${shipment.dimensionsCm?.width||0}x${shipment.dimensionsCm?.height||0} cm`);
    
    // Barcode
    doc.moveDown(1);
    doc.image(barcodeBuffer, (doc.page.width - 200) / 2, doc.y, { width: 200 });
    doc.moveDown(4);

    doc.font('Helvetica').fontSize(8).text(`Date: ${new Date().toLocaleDateString()} | Status: ${shipment.status}`, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}

async function getInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.getShipmentForActor(id, req.user);
    if (!shipment) throw ApiError.notFound('Shipment not found');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${shipment.trackingId}.pdf`);
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(24).text('SHIPTRACK INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.text(`Tracking ID: ${shipment.trackingId}`, { align: 'right' });
    doc.text(`Status: ${shipment.status}`, { align: 'right' });

    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(14).text('Billed To:');
    doc.font('Helvetica').fontSize(10).text(`Customer ID: ${shipment.customerId}`);
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(12).text('Shipment Details:');
    doc.font('Helvetica').fontSize(10);
    doc.text(`From: ${shipment.origin.city}, ${shipment.origin.country}`);
    doc.text(`To: ${shipment.destination.city}, ${shipment.destination.country}`);
    doc.text(`Service: ${shipment.serviceType || 'STANDARD'}`);
    doc.text(`Weight: ${shipment.weightKg} kg`);

    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(12).text('Itemized Charges:');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Base Fare: ${shipment.baseFare || 0} ${shipment.currency}`);
    doc.text(`Distance Charge: ${shipment.distanceCharge || 0} ${shipment.currency}`);
    doc.text(`Weight/Volumetric Charge: ${shipment.weightCharge || 0} ${shipment.currency}`);
    doc.text(`Taxes & Surcharges: ${shipment.taxAmount || 0} ${shipment.currency}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).text(`TOTAL AMOUNT: ${shipment.totalAmount || shipment.quotedPrice || 0} ${shipment.currency}`);

    doc.moveDown(3);
    doc.font('Helvetica').fontSize(10).text('Thank you for shipping with ShipTrack V2 Logistics.', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getLabel, getInvoice };
