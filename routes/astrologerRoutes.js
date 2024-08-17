const express = require('express');
const {
  createAstrologer,
  getAstrologer,
  updateAstrologer,
  deleteAstrologer,
  getAstrologers,
} = require('../controllers/astrologerController');
const router = express.Router();

router.route('/').post(createAstrologer).get(getAstrologers);
router
  .route('/:id')
  .get(getAstrologer)
  .put(updateAstrologer)
  .delete(deleteAstrologer);

module.exports = router;
