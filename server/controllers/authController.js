const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'ucpian_default_secret_key_123';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@ucp';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      plan: user.plan,
      downloadsCount: user.downloadsCount,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateAdminToken = () => {
  return jwt.sign(
    {
      id: 'admin',
      name: 'Administrator',
      email: ADMIN_USERNAME,
      profilePic: '',
      plan: 'Ultra',
      downloadsCount: 0,
      role: 'admin',
      isAdmin: true
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const formatUserResponse = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  profilePic: user.profilePic || '',
  plan: user.plan,
  downloadsCount: user.downloadsCount,
  role: user.role || 'user',
  isAdmin: user.role === 'admin' || user.isAdmin === true
});

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = User.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = User.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      plan: 'Basic',
      downloadsCount: 0
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Error in register controller:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const user = User.findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password. Please register first.' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'This account uses Google sign-in. Please log in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Error in login controller:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    const adminUser = {
      id: 'admin',
      name: 'Administrator',
      email: ADMIN_USERNAME,
      profilePic: '',
      plan: 'Ultra',
      downloadsCount: 0,
      role: 'admin',
      isAdmin: true
    };

    const token = generateAdminToken();

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: adminUser
    });
  } catch (error) {
    console.error('Error in adminLogin controller:', error);
    res.status(500).json({ message: 'Server error during admin login.', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.isAdmin) {
      return res.status(200).json({
        user: formatUserResponse(req.user)
      });
    }

    const user = User.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Error in getProfile controller:', error);
    res.status(500).json({ message: 'Error retrieving user profile.', error: error.message });
  }
};

exports.upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !['Basic', 'Pro', 'Ultra', 'Free'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected. Choose Basic, Pro, or Ultra.' });
    }

    const normalizedPlan = plan === 'Free' ? 'Basic' : plan;

    const user = User.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updatedUser = User.updateUser(req.user.id, {
      plan: normalizedPlan,
      downloadsCount: 0
    });

    const token = generateToken(updatedUser);

    res.status(200).json({
      message: `Successfully upgraded to ${normalizedPlan} Plan!`,
      token,
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    console.error('Error in upgradePlan controller:', error);
    res.status(500).json({ message: 'Error upgrading subscription plan.', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = User.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getAllUsers controller:', error);
    res.status(500).json({ message: 'Error retrieving user list.', error: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required.' });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account email is required.' });
    }

    let user = User.findUserByGoogleIdOrEmail(googleId, email);

    if (user) {
      const updates = {};
      if (!user.googleId) {
        updates.googleId = googleId;
        updates.authProvider = 'google';
      }
      if (picture && !user.profilePic) {
        updates.profilePic = picture;
      }

      if (Object.keys(updates).length > 0) {
        user = User.updateUser(user._id, updates);
      }
    } else {
      user = User.createUser({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        authProvider: 'google',
        profilePic: picture || '',
        plan: 'Basic',
        downloadsCount: 0
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Google login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Error in googleLogin controller:', error);
    res.status(401).json({ message: 'Google authentication failed.', error: error.message });
  }
};
