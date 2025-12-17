const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer'); // New: Handles files
const cloudinary = require('cloudinary').v2; // New: Talks to cloud
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configure Multer (To keep files in memory briefly)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ DB Error:', err));

// Define Product Model
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  image: String,
  description: String,
  sizes: [String]
}));

// --- ROUTES ---

// GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET SINGLE PRODUCT
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🆕 POST: CREATE NEW PRODUCT (With Image Upload)
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    // Check if user sent a file
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // 1. Upload image to Cloudinary
    // convert the file buffer to a generic base64 string
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const cldRes = await cloudinary.uploader.upload(dataURI, {
      folder: "sabc4-store"
    });

    // 2. Create the Product in MongoDB using the Cloudinary URL
    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      image: cldRes.secure_url, // The Magic Link from Cloudinary
      sizes: req.body.sizes ? req.body.sizes.split(',') : ['S', 'M', 'L']
    });

    await newProduct.save();
    res.status(201).json(newProduct);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));