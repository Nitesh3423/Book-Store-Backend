const User = require('../models/user-model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Register
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, googleId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      googleId,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login
exports.loginUser = async (req, res) => {
  try {
    const { email, password, googleId } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (googleId && user.googleId !== googleId)
      return res.status(400).json({ error: 'Google login failed' });

    if (!googleId && !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id, role: 'user' }, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
