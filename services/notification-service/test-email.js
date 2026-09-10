const nodemailer = require('nodemailer');

async function test() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'guptaabhinav697@gmail.com',
        pass: 'tafouptkutwvcpoc'
      }
    });

    const info = await transporter.sendMail({
      from: 'ShipTrack <guptaabhinav697@gmail.com>',
      to: 'guptaabhinav697@gmail.com',
      subject: 'Test Email from ShipTrack',
      text: 'If you get this, SMTP is working.'
    });
    console.log('Success!', info.messageId);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
