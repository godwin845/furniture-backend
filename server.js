require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 10000; // Use environment variable for port

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Routes

// Get all users
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await User.find(); // Retrieves all users from the database
    res.status(200).json(users); // Return the list of users
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    res.status(200).json({ message: 'Login successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in.' });
  }
});

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imageUrl: String,
});

// Create product model
const Product = mongoose.model('Product', productSchema);

// Routes
app.get('/api/products', async (req, res) => {
  try {
      const products = await Product.find();
      res.json(products);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// POST - Add new product
app.post('/api/products', async (req, res) => {
  const { name, price, imageUrl } = req.body;
  const newProduct = new Product({
      name,
      price,
      imageUrl
  });

  try {
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
  } catch (error) {
      res.status(400).json({ message: 'Error adding product', error: error.message });
  }
});

// PUT - Update existing product by ID
app.put('/api/products/:id', async (req, res) => {
  const { name, price, imageUrl } = req.body;

  try {
      const updatedProduct = await Product.findByIdAndUpdate(
          req.params.id, 
          { name, price, imageUrl },
          { new: true } // Return the updated product
      );

      if (!updatedProduct) {
          return res.status(404).json({ message: 'Product not found' });
      }

      res.json(updatedProduct);
  } catch (error) {
      res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// DELETE - Remove a product by ID
app.delete('/api/products/:id', async (req, res) => {
  try {
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);

      if (!deletedProduct) {
          return res.status(404).json({ message: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully' });
  } catch (error) {
      res.status(400).json({ message: 'Error deleting product', error: error.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});