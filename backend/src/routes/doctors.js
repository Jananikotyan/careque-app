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
    res.json(data && data.length > 0 ? data : [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Dr. Gregory House', specialty: 'Diagnostic Medicine' }]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
