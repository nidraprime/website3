const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  customerName: {
    type: String,
    required: true
  },

  customerMobile: {
    type: String,
    required: true
  },

  purchaseId: {
    type: String,
    required: true
  },

  productName: {
    type: String,
    required: true
  },

  requestId: {
    type: String,
    unique: true,
    required: true
  },

  issue: {
    type: String,
    required: true
  },

  status: {
    type: String,
    default: 'Pending'
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model(
    'ServiceRequest',
    ServiceRequestSchema
  );