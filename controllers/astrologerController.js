const Astrologer = require('../models/Astrologer');

exports.createAstrologer = async (req, res) => {
  try {
    const astrologer = new Astrologer(req.body);
    await astrologer.save();
    res.status(201).json({ success: true, data: astrologer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAstrologer = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.params.id);
    if (!astrologer) {
      return res.status(404).json({ success: false, error: 'Astrologer not found' });
    }
    res.status(200).json({ success: true, data: astrologer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAstrologer = async (req, res) => {
  try {
    const astrologer = await Astrologer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!astrologer) {
      return res.status(404).json({ success: false, error: 'Astrologer not found' });
    }
    res.status(200).json({ success: true, data: astrologer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteAstrologer = async (req, res) => {
  try {
    const astrologer = await Astrologer.findByIdAndDelete(req.params.id);
    if (!astrologer) {
      return res.status(404).json({ success: false, error: 'Astrologer not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAstrologers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const astrologers = await Astrologer.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: astrologers.length,
      data: astrologers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
