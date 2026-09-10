const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('https://shiptrack-api-gateway.onrender.com/api/v1/auth/login', {
      email: 'admin@shiptrack.com',
      password: 'Admin@ShipTrack2026!'
    });
    const token = res.data.accessToken;

    const notif = await axios.post('https://shiptrack-notification-service.onrender.com/api/v1/notifications/send', {
      to: 'guptaabhinav697@gmail.com',
      type: 'EMAIL_VERIFICATION',
      data: { name: 'Admin Test Direct', otp: '654321' }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", JSON.stringify(notif.data));
  } catch(err) {
    console.log("Error status:", err.response ? err.response.status : err.message);
    console.log("Error data:", err.response ? err.response.data : '');
  }
}
run();
