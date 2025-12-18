const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Config (Storage in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ DB Error:', err));

// --- 🆕 UPDATED SCHEMA ---
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  images: [String], // Changed from 'image' to 'images' (Array)
  sizes: [String],
  createdAt: { type: Date, default: Date.now } // Good for sorting
});

const Product = mongoose.model('Product', ProductSchema);

// --- ROUTES ---

// GET ALL
app.get('/api/products', async (req, res) => {
  try {
    // Sort by newest first
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET ONE
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🆕 CREATE (With Multiple Images)
// We use upload.array('images', 5) -> allows up to 5 photos
app.post('/api/products', upload.array('images', 5), async (req, res) => {
  try {
    const imageFiles = req.files;

    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Upload ALL images to Cloudinary concurrently
    const uploadPromises = imageFiles.map(file => {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = "data:" + file.mimetype + ";base64," + b64;
      return cloudinary.uploader.upload(dataURI, { folder: "sabc4-store" });
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    // Extract just the URLs from the results
    const imageUrls = uploadResults.map(result => result.secure_url);

    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      images: imageUrls, // Save the array of URLs
      sizes: req.body.sizes ? req.body.sizes.split(',') : ['S', 'M', 'L']
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// 🆕 DELETE ROUTE
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));