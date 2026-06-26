const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

const CUSTOMER_UPDATABLE_FIELDS = ['name', 'mobile', 'email'];
const PURCHASE_UPDATABLE_FIELDS = ['userId', 'productName', 'size', 'price', 'purchaseDate', 'warrantyYears'];

function pick(source, allowedFields) {
  const result = {};
  allowedFields.forEach(field => {
    if (source[field] !== undefined) result[field] = source[field];
  });
  return result;
}

// UPDATE CUSTOMER
router.put(
  '/admin/update-customer/:id',

  async (req, res) => {

    try {

      const updates = pick(req.body, CUSTOMER_UPDATABLE_FIELDS);

      const updated =
        await User.findByIdAndUpdate(

          req.params.id,

          updates,

          { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

      res.json({

        success: true,

        customer: updated
      });

    } catch (error) {

      res.status(500).json({
        success: false
      });
    }
  }
);

// RESET CUSTOMER PASSWORD
router.put(
  '/admin/reset-customer-password/:id',

  async (req, res) => {

    try {

      const { newPassword } = req.body;

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updated = await User.findByIdAndUpdate(

        req.params.id,

        { password: hashedPassword },

        { new: true }
      ).select('-password -resetPasswordToken -resetPasswordExpires');

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      res.json({
        success: true,
        customer: updated
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false
      });
    }
  }
);

// DELETE CUSTOMER
router.delete(
  '/admin/delete-customer/:id',

  async (req, res) => {

    try {

      await User.findByIdAndDelete(
        req.params.id
      );

      await Purchase.deleteMany({

        userId:
          req.params.id
      });

      await ServiceRequest.deleteMany({

        userId:
          req.params.id
      });

      res.json({
        success: true
      });

    } catch (error) {

      res.status(500).json({
        success: false
      });
    }
  }
);

// GET ALL SERVICE REQUESTS
router.get('/admin/service-requests',
async (req, res) => {

  try {

    const requests =
      await ServiceRequest.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// UPDATE REQUEST STATUS
router.put('/admin/update-request-status/:id',
async (req, res) => {

  try {

    const { status } = req.body;

    const allowed = [
      'Pending',
      'In Review',
      'Technician Assigned',
      'Resolved'
    ];

    if (!allowed.includes(status)) {

      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const request =
      await ServiceRequest.findByIdAndUpdate(

        req.params.id,

        { status },

        { new: true }
      );

    if (!request) {

      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      request
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }
});

// GET ALL CUSTOMERS
router.get('/admin/customers', async (req, res) => {

  try {

    const customers = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      customers
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }

});

// ADD CUSTOMER
router.post('/admin/add-customer', async (req, res) => {

  try {

    const {
      name,
      mobile,
      password,
      email
    } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile, and password are required'
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile must be exactly 10 digits'
      });
    }

    const existingUser =
      await User.findOne({ mobile });

    if (existingUser) {

      return res.status(409).json({
        success: false,
        message: 'Customer with this mobile already exists'
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const customerId =
      await User.generateCustomerId();

    const customer =
      await User.create({

        customerId,

        name,
        mobile,
        email,

        password:
          hashedPassword
      });

    res.json({

      success: true,

      customerId:
        customer.customerId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: 'Server error'
    });
  }
});

// GET CUSTOMER DETAILS
router.get('/admin/customer/:id', async (req, res) => {

  try {

    const customer =
      await User.findById(req.params.id)
        .select('-password -resetPasswordToken -resetPasswordExpires');

    const purchases =
      await Purchase.find({
        userId: req.params.id
      });

    const requests =
      await ServiceRequest.find({
        userId: req.params.id
      });

    res.json({

      success: true,

      customer,

      purchases,

      requests
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }

});

// ALL PURCHASES
router.get('/admin/purchases', async (req, res) => {

  try {

    const purchases =
      await Purchase.find()
      .populate(
        'userId',
        'customerId name mobile email'
      )
      .sort({
        purchaseDate: -1
      });

    res.json({

      success: true,

      purchases
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }
});

// SINGLE PURCHASE
router.get('/admin/purchase/:id', async (req, res) => {

  try {

    const purchase =
      await Purchase.findById(
        req.params.id
      ).populate(
        'userId',
        'customerId name mobile email'
      );

    res.json({

      success: true,

      purchase
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }
});

// UPDATE PURCHASE
router.put('/admin/update-purchase/:id', async (req, res) => {

  try {

    const updates = pick(req.body, PURCHASE_UPDATABLE_FIELDS);

    const updated =
      await Purchase.findByIdAndUpdate(

        req.params.id,

        updates,

        { new: true }
      );

    res.json({

      success: true,

      purchase: updated
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }
});

// DELETE PURCHASE
router.delete('/admin/delete-purchase/:id', async (req, res) => {

  try {

    await Purchase.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false
    });
  }
});

// ADD PURCHASE
router.post('/admin/add-purchase', async (req, res) => {

  try {

    const {
      customerId,
      productId,
      purchaseDate
    } = req.body;

    const customer =
      await User.findOne({
        customerId
      });

    if (!customer) {

      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const product =
      await Product.findOne({
        productId
      });

    if (!product) {

      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const orderId =
      'NP' +
      Date.now()
        .toString()
        .slice(-6);

    const purchase =
      await Purchase.create({

        userId: customer._id,

        orderId,

        productName:
          product.name,

        size:
          product.size || '',

        price:
          product.price,

        purchaseDate,

        warrantyYears:
          product.warrantyYears
      });

    res.json({

      success: true,

      purchaseId:
        purchase.orderId,

      purchase
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;
