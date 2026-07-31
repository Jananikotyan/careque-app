const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createAppointment, updateAppointmentStatus, deleteAppointment } = require('../controllers/appointmentController');

router.post('/', protect, createAppointment);
router.patch('/:appointment_id/status', protect, updateAppointmentStatus);
router.delete('/:appointment_id', protect, deleteAppointment);

module.exports = router;
