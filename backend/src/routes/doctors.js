const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDoctorQueue, callNextPatient, getDoctorSlots, getRecommendations } = require('../controllers/appointmentController');
const supabase = require('../config/supabase');

router.get('/:doctor_id/queue', protect, getDoctorQueue);
router.get('/:doctor_id/next', protect, callNextPatient);
router.get('/:doctor_id/slots', getDoctorSlots);
router.get('/:doctor_id/recommendations', protect, getRecommendations);

// Extra route to get all doctors for the frontend listing
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('doctors').select('id, name, specialty');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
