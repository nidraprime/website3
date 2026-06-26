const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const Purchase = require('../models/Purchase');

const ServiceRequest = require('../models/ServiceRequest');
const transporter = require('../config/mailer');
// CUSTOMER PURCHASES
router.get('/customer-purchases', authMiddleware, async (req, res) => {

  try {

    const purchasesDB = await Purchase.find({
      userId: req.user.id
    });

    const purchases = purchasesDB.map(p => {

      const expiryDate = new Date(p.purchaseDate);

      expiryDate.setFullYear(
        expiryDate.getFullYear() + p.warrantyYears
      );

      const today = new Date();

      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (expiryDate - today) /
          (1000 * 60 * 60 * 24)
        )
      );

      // ─── Pro-rata warranty value ──────────────────────────────
      // First 12 months: full warranty, free replacement.
      // From month 13 onward: value depreciates by (price / totalMonths) per month.
      const totalMonths = p.warrantyYears * 12;

      const purchaseDate = new Date(p.purchaseDate);
      const monthsElapsed = Math.max(0,
        (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (today.getMonth() - purchaseDate.getMonth())
      );

      const monthlyDepreciation = p.price / totalMonths;

      const depreciatedAmount = Math.min(
        p.price,
        Math.round(Math.max(0, monthsElapsed - 12) * monthlyDepreciation)
      );

      const currentValue = p.price - depreciatedAmount;

      const warrantyPhase =
        monthsElapsed >= totalMonths
          ? 'Expired'
          : monthsElapsed < 12
            ? 'Full Warranty'
            : 'Pro-Rata';

      return {

        id: p.orderId,

        productName: p.productName,

        price: p.price,

        purchaseDate: p.purchaseDate,

        warrantyYears: p.warrantyYears,

        warrantyExpiry: expiryDate,

        warrantyStatus:
          daysRemaining > 0
            ? 'Valid'
            : 'Expired',

        daysRemaining,

        warrantyPhase,

        monthlyDepreciation: Math.round(monthlyDepreciation),

        depreciatedAmount,

        currentValue
      };

    });

    res.json({
      success: true,
      purchases
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
//Load Customer Purchases in service request
router.get('/my-service-requests',
authMiddleware,
async (req, res) => {

  try {

    const requests =
      await ServiceRequest.find({

        userId: req.user.id

      }).sort({
        createdAt: -1
      });

    res.json({

      success: true,

      requests
    });

  } catch (error) {

    res.status(500).json({

      success: false
    });
  }
});

// SERVICE REQUEST
router.post('/request-service', authMiddleware, async (req, res) => {

  try {

    const { purchaseId, issue } = req.body;

    const requestId =
      'SR' +
      Date.now().toString().slice(-6);

    const purchase =
  await Purchase.findOne({
    orderId: purchaseId
  });

const User =
  require('../models/User');

const customer =
  await User.findById(req.user.id);

await ServiceRequest.create({

  userId: req.user.id,

  customerName:
    customer.name,

  customerMobile:
    customer.mobile,

  purchaseId,

  productName:
    purchase
      ? purchase.productName
      : 'Unknown Product',

  requestId,

  issue,

  status: 'Pending'
});
   const info= await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: 'care@nidraprime.com',

      subject: `New Service Request - ${requestId}`,

      html: `
        <h2>New Service Request</h2>

        <p><strong>Request ID:</strong> ${requestId}</p>

        <p><strong>Purchase:</strong> ${purchaseId}</p>

        <p><strong>Issue:</strong></p>

        <p>${issue}</p>
      `
    });
    console.log('EMAIL SENT',info);

    res.json({

      success: true,

      requestId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      message: 'Server error'
    });
  }
});

module.exports = router;