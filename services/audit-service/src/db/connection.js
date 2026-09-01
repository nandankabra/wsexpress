const mongoose = require('mongoose');

async function connect() {
  await mongoose.connect(process.env.MONGO_URL);
}

module.exports = { connect, mongoose };
