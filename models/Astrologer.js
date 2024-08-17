const mongoose = require('mongoose');

const AstrologerSchema = new mongoose.Schema({
  name: String,
  title: String,
  expertise: String,
  languages: [String],
  experience: Number,
  online: Boolean,
  price: Number,
  free: Boolean,
  reviews: Number,
  stars: Number,
  profileImage: String,
  ribbon: String,
  deal: String,
  bio: String,
  expertiseAreas: [String],
  services: [
    {
      name: String,
      description: String,
      price: Number,
    },
  ],
  contactInfo: {
    email: String,
    phone: String,
    location: String,
    timezone: String,
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    youtube: String,
  },
  availability: {
    days: [String],
    hours: String,
  },
  education: [String],
  publications: [String],
});

const Astrologer = mongoose.model('Astrologer', AstrologerSchema);
module.exports = Astrologer;
