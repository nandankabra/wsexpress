const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('https://shiptrack-api-gateway.onrender.com/api/v1/auth/login', {
      email: 'admin@shiptrack.com',
      password: 'Admin@ShipTrack2026!'
    });
    const token = res.data.accessToken;

    const notif = await axios.post('https://shiptrack-api-gateway.onrender.com/api/v1/notifications/send', {
      to: 'guptaabhinav697@gmail.com',
      type: 'EMAIL_VERIFICATION',
      data: { name: 'Admin Test', otp: '123456' }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(notif.data);
  } catch(err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
run();
