const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  orderId: {
    type: String,
    required: true,
    unique: true
  },

  productName: {
    type: String,
    required: true
  },

  size: {
    type: String,
    default: ''
  },

  price: {
    type: Number,
    required: true
  },

  purchaseDate: {
    type: Date,
    required: true
  },

  warrantyYears: {
    type: Number,
    required: true
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', PurchaseSchema);