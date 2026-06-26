require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI);

async function createUser() {

  try {

    const existing = await User.findOne({
      mobile: '7838647677'
    });

    if (existing) {
      console.log('User already exists');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('demo1234', 10);

    await User.create({

      customerId: 'NPC1000',

      name: 'Demo Customer',

      mobile: '7838647677',

      email: 'demo@nidraprime.com',

      password: hashedPassword
    });

    console.log('✅ User Created');

    process.exit();

  } catch (error) {

    console.error(error);

    process.exit(1);
  }
}

createUser();
