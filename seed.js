const mongoose = require('mongoose');
require('dotenv').config();

const Product = mongoose.model('Product', new mongoose.Schema({
  name: String, price: Number, category: String, image: String, description: String, sizes: [String]
}));

const products = [
  {
    name: "SABC4 Heritage Tee",
    price: 450,
    category: "T-Shirts",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop",
    description: "Premium cotton tee paying homage to Mzansi.",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Jozi Streets Hoodie",
    price: 850,
    category: "Hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop",
    description: "Heavyweight fleece for the winter.",
    sizes: ["M", "L", "XL"]
  },
  {
    name: "Kasi Cargo Pants",
    price: 950,
    category: "Pants",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop",
    description: "Utility meets style.",
    sizes: ["30", "32", "34"]
  },
  {
    name: "Soweto Bucket Hat",
    price: 300,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1575428652377-a2697242636b?q=80&w=1000&auto=format&fit=crop",
    description: "Essential summer accessory.",
    sizes: ["One Size"]
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Deleting old data...');
    await Product.deleteMany({});
    console.log('Seeding SABC4 products...');
    await Product.insertMany(products);
    console.log('✅ Done!');
    process.exit();
  });