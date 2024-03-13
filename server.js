const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Medicine = require('./models/medicine');

const app = express();
const port = 3000;
const secretKey = 'mysecretkey';

mongoose.connect('mongodb://localhost/MedicalstoreApi',);

app.use(bodyParser.json());
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Bearer token not provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secretKey);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid user' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};


app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Simple validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create a new user
    const newUser = new User({ username, password });
    await newUser.save();

    res.json({ message: 'Signup successful', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/add-medicine', authenticateUser, async (req, res) => {
  const { name, price, quantity } = req.body;
  if (!name || !price || !quantity) {
    return res.status(400).json({ error: 'Name, price, and quantity are required' });
  }
  try {
    const newMedicine = new Medicine({ name, price, quantity });
    await newMedicine.save();
    res.json({ message: 'Medicine added successfully', medicine: newMedicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/edit-medicine/:id', authenticateUser, async (req, res) => {
  

  const { name, price, quantity } = req.body;

  

  try {
    const medicineId = req.params.id;

    if (!name || !price || !quantity) {
      return res.status(400).json({ error: 'Name, price, and quantity are required' });
    }
    const medicine = await Medicine.findByIdAndUpdate(
      medicineId,
      { name, price, quantity },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ message: 'Medicine updated successfully', medicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/delete-medicine/:id', authenticateUser, async (req, res) => {
  const medicineId = req.params.id;

  try {
    const deletedMedicine = await Medicine.findByIdAndDelete(medicineId);

    if (!deletedMedicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully', medicine: deletedMedicine });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/list-medicines', authenticateUser, async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json({ medicines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/search-medicines', authenticateUser, async (req, res, next) => {
  try {
    const { medicineName } = req.query;

    const searchResults = await Medicine.find({
      name: { $regex: medicineName, $options: "i" },
    });

    res.json({
      status: "Success",
      data: searchResults,
    });
  } catch (err) {
    console.log(err);
    next(appError(err.message));
  }
});

app.listen(port, () => {
  console.log("Port running at 3000");
});
