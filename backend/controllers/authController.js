const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // register me:
    if ([name, email, password].some((v) => typeof v !== 'string')) {
      return res.status(400).json({ message: 'name, email and password must be text' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Role hamesha employee; reviewer ko hum seed script se banayenge
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.EMPLOYEE,
    });

    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // login me:
    if ([email, password].some((v) => typeof v !== 'string')) {
      return res.status(400).json({ message: 'email and password must be text' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    const isMatch = user && (await bcrypt.compare(password, user.passwordHash));

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    req.log.error('request_failed', { err: error });
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = { register, login };