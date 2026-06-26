const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({

  productId: {
    type: String,
    unique: true,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  category: {
    type: String,
    default: 'Mattress'
  },

  tagline: {
    type: String
  },

  description: {
    type: String
  },

  price: {
    type: Number,
    required: true
  },

  discount: {
    type: Number,
    default: 0
  },

  warrantyYears: {
    type: Number,
    default: 10
  },

  rating: {
    type: Number,
    default: 5
  },

  reviews: {
    type: Number,
    default: 0
  },

  stock: {
    type: Number,
    default: 0
  },

  active: {
    type: Boolean,
    default: true
  },

  image: {
    type: String,
    default: '/homepagemain.png'
  },

  imagePublicId: {
    type: String,
    default: ''
  },

  baseWidth: {
    type: Number,
    default: 60
  },

  baseLength: {
    type: Number,
    default: 78
  },

  features: {
    type: [String],
    default: []
  },

  layers: {
    type: [String],
    default: []
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model(
    'Product',
    ProductSchema
  );