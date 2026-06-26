require('dotenv').config();
const connectDB = require('./config/db');
const express = require('express');
const path = require('path');
const transporter = require('./config/mailer');
const adminAuthMiddleware = require('./middleware/adminAuthMiddleware');
const app = express();
connectDB();

app.use(express.json());
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/customer'));
app.use('/admin', adminAuthMiddleware);
app.use('/', require('./routes/admin'));
app.use('/', require('./routes/products'));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Inquiry ────────────────────────────────────────────────────────────────
app.post('/send-inquiry', async (req, res) => {

  const { name, phone, city, product, message } = req.body;

  try {

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'nidraprime@gmail.com',
      subject: 'New NidraPrime Inquiry',
      html: `
        <h2>New Inquiry</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>City:</strong> ${city}</p>
        <p><strong>Product:</strong> ${product}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    });

    res.json({ success: true });

  } catch (error) {

    console.error(error);
    res.status(500).json({ success: false });
  }

});

// ─── 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🛏️  NidraPrime Server running at http://localhost:${PORT}\n`);
});
