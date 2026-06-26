require('dotenv').config();

const mongoose = require('mongoose');

const User = require('./models/User');
const Purchase = require('./models/Purchase');

mongoose.connect(process.env.MONGO_URI);

async function createPurchase() {

  try {

    const user = await User.findOne({
      mobile: '9876543210'
    });

    if (!user) {
      console.log('Customer not found');
      process.exit();
    }

    const existing = await Purchase.findOne({
      orderId: 'NP1001'
    });

    if (existing) {
      console.log('Purchase already exists');
      process.exit();
    }

    await Purchase.create({

      userId: user._id,

      orderId: 'NP1001',

      productName: 'NidraPrime Orthopedic Mattress',

      size: '72 x 72',

      price: 24999,

      purchaseDate: new Date('2025-01-10'),

      warrantyYears: 10
    });

    console.log('✅ Purchase Created');

    process.exit();

  } catch (error) {

    console.error(error);

    process.exit(1);
  }
}

createPurchase();