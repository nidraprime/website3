const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const CATEGORIES = ['Orthopedic', 'Premium', 'Luxury', 'Essential'];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

function handleImageUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'nidraprime/products' },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

function deleteUploadedImage(imagePath, imagePublicId) {
  if (imagePublicId) {
    cloudinary.uploader.destroy(imagePublicId, () => {});
    return;
  }
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  fs.unlink(path.join('public', imagePath), () => {});
}

function parseLines(text) {
  if (!text) return [];
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}


// GET ALL PRODUCTS
router.get('/api/products',
async (req, res) => {

  try {

    const products =
      await Product.find({
        active: true
      });

    res.json({
      success: true,
      products
    });

  } catch (error) {

    res.status(500).json({
      success: false
    });
  }
});


// GET SINGLE PRODUCT
router.get('/api/products/:id',
async (req, res) => {

  try {

    const product =
      await Product.findOne({
        _id: req.params.id,
        active: true
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {

    res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
});


// ADMIN ADD PRODUCT
router.post('/admin/add-product', handleImageUpload,
async (req, res) => {

  try {

    const {
      name,
      category,
      tagline,
      description
    } = req.body;

    const price = Number(req.body.price);
    const discount = req.body.discount !== undefined ? Number(req.body.discount) : 0;
    const warrantyYears = req.body.warrantyYears !== undefined ? Number(req.body.warrantyYears) : 10;
    const stock = req.body.stock !== undefined ? Number(req.body.stock) : 0;
    const baseWidth = req.body.baseWidth !== undefined ? Number(req.body.baseWidth) : 60;
    const baseLength = req.body.baseLength !== undefined ? Number(req.body.baseLength) : 78;
    const features = parseLines(req.body.featuresText);
    const layers = parseLines(req.body.layersText);

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and price are required.'
      });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category.'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than zero.'
      });
    }

    if (baseWidth <= 0 || baseLength <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Base width and length must be greater than zero.'
      });
    }

    let imageFields = {};

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer);
      imageFields = {
        image: uploaded.secure_url,
        imagePublicId: uploaded.public_id
      };
    }

    const productId =
      'NP-PROD-' +
      Date.now().toString().slice(-6);

    const product =
      await Product.create({

        productId,

        name,

        category,

        tagline,

        description,

        price,

        discount,

        warrantyYears,

        stock,

        baseWidth,

        baseLength,

        features,

        layers,

        ...imageFields
      });

    res.json({
      success: true,
      product
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// ADMIN DELETE PRODUCT
router.delete('/admin/delete-product/:id',
async (req, res) => {

  try {

    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );

    if (product) deleteUploadedImage(product.image, product.imagePublicId);

    res.json({
      success: true
    });

  } catch (error) {

    res.status(500).json({
      success: false
    });

  }
});


// ADMIN UPDATE PRODUCT
router.put('/admin/update-product/:id', handleImageUpload,
async (req, res) => {

  try {

    const updates = {};
    const { name, category, tagline, description } = req.body;

    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (tagline !== undefined) updates.tagline = tagline;
    if (description !== undefined) updates.description = description;
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.discount !== undefined) updates.discount = Number(req.body.discount);
    if (req.body.warrantyYears !== undefined) updates.warrantyYears = Number(req.body.warrantyYears);
    if (req.body.stock !== undefined) updates.stock = Number(req.body.stock);
    if (req.body.baseWidth !== undefined) updates.baseWidth = Number(req.body.baseWidth);
    if (req.body.baseLength !== undefined) updates.baseLength = Number(req.body.baseLength);
    if (req.body.featuresText !== undefined) updates.features = parseLines(req.body.featuresText);
    if (req.body.layersText !== undefined) updates.layers = parseLines(req.body.layersText);

    let oldImage = null;
    let oldImagePublicId = null;

    if (req.file) {
      const existing = await Product.findById(req.params.id);
      oldImage = existing ? existing.image : null;
      oldImagePublicId = existing ? existing.imagePublicId : null;

      const uploaded = await uploadToCloudinary(req.file.buffer);
      updates.image = uploaded.secure_url;
      updates.imagePublicId = uploaded.public_id;
    }

    const updated =
      await Product.findByIdAndUpdate(

        req.params.id,

        updates,

        { new: true }
      );

    if (req.file) deleteUploadedImage(oldImage, oldImagePublicId);

    res.json({
      success: true,
      product: updated
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }
});

module.exports = router;
