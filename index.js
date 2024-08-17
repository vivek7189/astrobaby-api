// File: .env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/astro-project
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

// File: app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/astrologers', require('./routes/astrologerRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// File: models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);

// File: models/Astrologer.js
const mongoose = require('mongoose');

const astrologerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  bio: String,
  experience: Number,
  languages: [String],
  expertiseAreas: [String],
  services: [{
    name: String,
    price: Number
  }],
  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  profileImage: String,
});

module.exports = mongoose.model('Astrologer', astrologerSchema);

// File: routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;

// File: routes/astrologerRoutes.js
const express = require('express');
const router = express.Router();
const astrologerController = require('../controllers/astrologerController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/profile', authMiddleware, astrologerController.createProfile);
router.put('/profile', authMiddleware, astrologerController.updateProfile);
router.get('/', astrologerController.listAstrologers);
router.get('/:id', astrologerController.getAstrologerDetails);

module.exports = router;

// File: controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      to: user.email,
      from: process.env.SMTP_USER,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset-password/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password has been reset' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// File: controllers/astrologerController.js
const Astrologer = require('../models/Astrologer');

exports.createProfile = async (req, res) => {
  try {
    const astrologer = new Astrologer({
      user: req.user._id,
      ...req.body
    });
    await astrologer.save();
    res.status(201).json(astrologer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const astrologer = await Astrologer.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!astrologer) {
      return res.status(404).json({ error: 'Astrologer profile not found' });
    }
    res.json(astrologer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listAstrologers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.expertiseArea) {
      query.expertiseAreas = req.query.expertiseArea;
    }
    if (req.query.language) {
      query.languages = req.query.language;
    }

    const astrologers = await Astrologer.find(query)
      .skip(skip)
      .limit(limit)
      .select('name title rating profileImage');

    const total = await Astrologer.countDocuments(query);

    res.json({
      astrologers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalAstrologers: total
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAstrologerDetails = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.params.id);
    if (!astrologer) {
      return res.status(404).json({ error: 'Astrologer not found' });
    }
    res.json(astrologer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// File: middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};