const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-Memory Data ───────────────────────────────────────────────────────────

const products = [
  {
    id: 1,
    name: 'NidraPrime OrthoCloud 7000',
    tagline: 'Engineered for deep, restorative sleep',
    price: 28999,
    originalPrice: 38000,
    category: 'Orthopedic',
    size: 'Queen',
    thickness: '8 inches',
    warranty: '10 years',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    layers: ['HR Foam Base (4")', 'Memory Foam (2")', 'Cooling Gel Layer (1")', 'Soft Quilted Top (1")'],
    features: ['Orthopedic Support', 'Zero Pressure Points', 'Temperature Regulation', 'Anti-Dust Mite', 'CertiPUR Certified'],
    description: 'The OrthoCloud 7000 is our flagship orthopedic mattress, designed with input from leading spine specialists. Its precision-engineered foam layers provide targeted lumbar support while allowing natural spinal alignment. Ideal for those with chronic back pain or anyone who demands the best from their sleep.',
    rating: 4.8,
    reviews: 342
  },
  {
    id: 2,
    name: 'NidraPrime RestoreMax Pro',
    tagline: 'Maximum support, cloud-like comfort',
    price: 19999,
    originalPrice: 26000,
    category: 'Premium',
    size: 'King',
    thickness: '6 inches',
    warranty: '8 years',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    layers: ['Bonded Foam Base (3")', 'HR Foam (2")', 'Knitted Fabric Top (1")'],
    features: ['Pressure Relief', 'Motion Isolation', 'Breathable Cover', 'CertiPUR Certified'],
    description: 'The RestoreMax Pro blends high-resilience foam with a plush knitted top to deliver exceptional comfort across all sleep positions. Its motion-isolation technology ensures undisturbed sleep, making it perfect for couples.',
    rating: 4.6,
    reviews: 218
  },
  {
    id: 3,
    name: 'NidraPrime SlimElite 5S',
    tagline: 'Slim profile, supreme comfort',
    price: 12499,
    originalPrice: 16500,
    category: 'Essential',
    size: 'Double',
    thickness: '5 inches',
    warranty: '5 years',
    image: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=800',
    layers: ['PU Foam Base (3")', 'Memory Foam (1")', 'Quilted Top (1")'],
    features: ['Compact Design', 'Durable Build', 'Washable Cover', 'Hypoallergenic'],
    description: 'Perfect for guest rooms, studio apartments, or growing children, the SlimElite 5S packs impressive comfort into a lean 5-inch profile. Its hypoallergenic materials and washable cover make it a practical, long-lasting investment.',
    rating: 4.4,
    reviews: 156
  },
  {
    id: 4,
    name: 'NidraPrime LuxeSleep Zen',
    tagline: 'Where luxury meets therapeutic science',
    price: 42999,
    originalPrice: 56000,
    category: 'Luxury',
    size: 'King',
    thickness: '10 inches',
    warranty: '12 years',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    layers: ['Latex Base (4")', 'HR Foam (2")', 'Copper-Infused Memory Foam (2")', 'Cashmere Blend Top (2")'],
    features: ['Natural Latex', 'Copper Infusion', 'Antimicrobial', 'Edge Support System', 'Zoned Comfort', '100-Night Trial'],
    description: 'The LuxeSleep Zen is the pinnacle of our range — a 10-inch marvel combining natural latex resilience with copper-infused memory foam for antimicrobial protection and superior temperature regulation. Finished with a cashmere-blend top, this is not just a mattress; it is a wellness investment.',
    rating: 4.9,
    reviews: 87
  },
  {
    id: 5,
    name: 'NidraPrime SpineCare 6000',
    tagline: 'Clinically inspired spinal support',
    price: 23499,
    originalPrice: 30000,
    category: 'Orthopedic',
    size: 'Queen',
    thickness: '7 inches',
    warranty: '10 years',
    image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
    layers: ['Firm HR Base (4")', 'Transition Foam (1.5")', 'Soft Comfort Layer (1.5")'],
    features: ['Zoned Lumbar Support', 'Firm Base', 'Ortho-Certified', 'Anti-Sag Technology'],
    description: 'Developed with orthopedic consultants, the SpineCare 6000 uses a three-zone support system that is firmer under the lumbar and hips, and softer at the shoulders and feet. Ideal for spondylitis, disc issues, and post-surgical recovery.',
    rating: 4.7,
    reviews: 193
  },
  {
    id: 6,
    name: 'NidraPrime AirFlow Breeze',
    tagline: 'Sleep cool, sleep deep',
    price: 17999,
    originalPrice: 23500,
    category: 'Premium',
    size: 'Double',
    thickness: '6 inches',
    warranty: '7 years',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
    layers: ['Open-Cell Foam Base (3")', 'Airflow Channeled Foam (2")', 'Cooling Gel Top (1")'],
    features: ['Open-Cell Technology', 'Airflow Channels', 'Cooling Gel', 'Moisture Wicking Cover'],
    description: 'Engineered for India\'s warm climate, the AirFlow Breeze uses open-cell foam and strategically placed air channels to draw heat away from your body throughout the night. The cooling gel top layer provides immediate relief on contact.',
    rating: 4.5,
    reviews: 271
  }
];

const customers = [
  {
    id: 'C001',
    name: 'Priya Sharma',
    mobile: '9876543210',
    password: 'pass123',
    email: 'priya.sharma@email.com'
  },
  {
    id: 'C002',
    name: 'Rajesh Mehta',
    mobile: '9123456789',
    password: 'secure456',
    email: 'rajesh.mehta@email.com'
  }
];

const purchases = [
  {
    id: 'PUR001',
    customerId: 'C001',
    productId: 1,
    productName: 'NidraPrime OrthoCloud 7000',
    price: 28999,
    purchaseDate: '2023-03-15',
    warrantyYears: 10,
    status: 'Active'
  },
  {
    id: 'PUR002',
    customerId: 'C001',
    productId: 6,
    productName: 'NidraPrime AirFlow Breeze',
    price: 17999,
    purchaseDate: '2024-07-20',
    warrantyYears: 7,
    status: 'Active'
  },
  {
    id: 'PUR003',
    customerId: 'C002',
    productId: 4,
    productName: 'NidraPrime LuxeSleep Zen',
    price: 42999,
    purchaseDate: '2024-01-10',
    warrantyYears: 12,
    status: 'Active'
  }
];

const serviceRequests = [];

const adminCredentials = { username: 'admin', password: 'nidraPrime@2024' };

// ─── Session Store (in-memory) ────────────────────────────────────────────────
const sessions = {};
function createSession(customerId) {
  const token = 'tok_' + Math.random().toString(36).substr(2, 16);
  sessions[token] = { customerId, createdAt: Date.now() };
  return token;
}
function getSession(token) {
  return sessions[token] || null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Products
app.get('/api/products', (req, res) => {
  res.json({ success: true, products });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// Customer Login
app.post('/customer-login', (req, res) => {
  const { mobile, password } = req.body;
  const customer = customers.find(c => c.mobile === mobile && c.password === password);
  if (!customer) return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
  const token = createSession(customer.id);
  res.json({ success: true, token, name: customer.name, customerId: customer.id });
});

// Admin Login
app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminCredentials.username && password === adminCredentials.password) {
    res.json({ success: true, message: 'Admin authenticated' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
});

// Customer Purchases (requires token)
app.get('/customer-purchases', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const session = getSession(token);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const customerPurchases = purchases.filter(p => p.customerId === session.customerId);
  const enriched = customerPurchases.map(p => {
    const purchaseDate = new Date(p.purchaseDate);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + p.warrantyYears);
    const today = new Date();
    const warrantyValid = expiryDate > today;
    return {
      ...p,
      warrantyExpiry: expiryDate.toISOString().split('T')[0],
      warrantyStatus: warrantyValid ? 'Valid' : 'Expired',
      daysRemaining: Math.max(0, Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)))
    };
  });

  res.json({ success: true, purchases: enriched });
});

// Request Service
app.post('/request-service', (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const session = getSession(token);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { purchaseId, issue } = req.body;
  const purchase = purchases.find(p => p.id === purchaseId && p.customerId === session.customerId);
  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

  const request = {
    id: 'SVC' + (serviceRequests.length + 1).toString().padStart(3, '0'),
    customerId: session.customerId,
    purchaseId,
    productName: purchase.productName,
    issue: issue || 'General service request',
    status: 'Pending',
    createdAt: new Date().toISOString().split('T')[0]
  };
  serviceRequests.push(request);
  res.json({ success: true, message: 'Service request submitted successfully', requestId: request.id });
});

// Add Customer (Admin)
app.post('/add-customer', (req, res) => {
  const { name, mobile, password, email } = req.body;
  if (!name || !mobile || !password) return res.status(400).json({ success: false, message: 'Name, mobile and password are required' });
  if (customers.find(c => c.mobile === mobile)) return res.status(409).json({ success: false, message: 'Customer with this mobile already exists' });
  const newCustomer = { id: 'C' + (customers.length + 1).toString().padStart(3, '0'), name, mobile, password, email: email || '' };
  customers.push(newCustomer);
  res.json({ success: true, message: 'Customer added successfully', customerId: newCustomer.id });
});

// Add Purchase (Admin)
app.post('/add-purchase', (req, res) => {
  const { customerId, productId, purchaseDate } = req.body;
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  const product = products.find(p => p.id === parseInt(productId));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const newPurchase = {
    id: 'PUR' + (purchases.length + 1).toString().padStart(3, '0'),
    customerId,
    productId: product.id,
    productName: product.name,
    price: product.price,
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    warrantyYears: parseInt(product.warranty),
    status: 'Active'
  };
  purchases.push(newPurchase);
  res.json({ success: true, message: 'Purchase recorded successfully', purchaseId: newPurchase.id });
});

// Get Service Requests (Admin)
app.get('/admin/service-requests', (req, res) => {
  res.json({ success: true, requests: serviceRequests });
});

// Get All Customers (Admin)
app.get('/admin/customers', (req, res) => {
  res.json({ success: true, customers: customers.map(c => ({ id: c.id, name: c.name, mobile: c.mobile, email: c.email })) });
});

// Serve HTML pages
app.get( (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🛏️  NidraPrime Server running at http://localhost:${PORT}`);
  console.log(`📦  ${products.length} products loaded`);
  console.log(`👥  ${customers.length} customers loaded`);
  console.log(`\nAdmin credentials: admin / nidraPrime@2024`);
  console.log(`Test customer: mobile=9876543210, password=pass123\n`);
});
