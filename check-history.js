const axios = require('axios');
async function run() {
  try {
    // login to auth-service to get admin token
    const res = await axios.post('https://shiptrack-api-gateway.onrender.com/api/v1/auth/login', {
      email: 'admin@shiptrack.com',
      password: 'Admin@ShipTrack2026!'
    });
    const token = res.data.accessToken;

    // fetch notifications history
    const notifs = await axios.get('https://shiptrack-api-gateway.onrender.com/api/v1/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(notifs.data, null, 2));
  } catch(err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
run();
