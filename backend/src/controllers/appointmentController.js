const supabase = require('../config/supabase');
const redis = require('../config/redis');
const logger = require('../config/logger');

exports.createAppointment = async (req, res, next) => {
  try {
    const { doctor_id, appointment_date, start_time } = req.body;
    const patient_id = req.user.id;

    // Redis distributed lock logic to prevent double booking
    const lockKey = `lock:doctor:slots:${doctor_id}:${appointment_date}:${start_time}`;
    const acquired = await redis.setnx(lockKey, 'locked');
    if (!acquired) {
      return res.status(409).json({ error: { message: 'Slot already booked or being processed' } });
    }
    // Set expiry for lock (e.g., 5 seconds)
    await redis.expire(lockKey, 5);

    // DB Insertion
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ patient_id, doctor_id, appointment_date, start_time, status: 'scheduled' }])
      .select('*, patients(name, email), doctors(name)')
      .single();

    if (error) {
      await redis.del(lockKey); // release lock
      if (error.code === '23505') { // unique violation
        return res.status(409).json({ error: { message: 'Slot already booked' } });
      }
      throw error;
    }

    // Add to Redis Queue
    const queueKey = `doctor:queue:${doctor_id}`;
    await redis.rpush(queueKey, data.id); // Add to end of queue (FIFO)
    
    // Get current queue length for position
    const queue_position = await redis.llen(queueKey);
    
    // Update queue position in DB
    await supabase.from('appointments').update({ queue_position }).eq('id', data.id);

    // Emit event via Socket.IO
    const io = req.app.get('io');
    io.to(`doctor_${doctor_id}`).emit('queue_updated', { message: 'New patient added to queue', appointment: data, queue_position });

    // Send Email Confirmation
    const { sendAppointmentConfirmation } = require('../utils/emailService');
    const patientName = data.patients?.name || 'Patient';
    const patientEmail = data.patients?.email || 'patient@example.com';
    const doctorName = data.doctors?.name || 'Doctor';
    
    // Await this so we can send the receipt HTML to the frontend (to bypass Render SMTP block)
    const emailData = await sendAppointmentConfirmation(patientEmail, patientName, doctorName, appointment_date, start_time);

    res.status(201).json({ message: 'Appointment booked successfully', appointment: { ...data, queue_position }, emailReceipt: emailData?.html });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorQueue = async (req, res, next) => {
  try {
    const { doctor_id } = req.params;
    const queueKey = `doctor:queue:${doctor_id}`;
    
    // Get all appointment IDs in queue
    const appointmentIds = await redis.lrange(queueKey, 0, -1);
    
    if (appointmentIds.length === 0) {
      return res.json({ queue: [] });
    }

    // Fetch details from Supabase
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(name)')
      .in('id', appointmentIds)
      .eq('status', 'scheduled')
      .order('queue_position', { ascending: true });

    if (error) throw error;
    
    res.json({ queue: data });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointment_id } = req.params;
    const { status } = req.body;
    
    // Status can be: 'in_progress', 'completed', 'cancelled'
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointment_id)
      .select()
      .single();

    if (error) throw error;

    // If completed or cancelled, remove from Redis queue
    if (status === 'completed' || status === 'cancelled') {
      const queueKey = `doctor:queue:${data.doctor_id}`;
      await redis.lrem(queueKey, 0, appointment_id);
      
      const io = req.app.get('io');
      io.to(`doctor_${data.doctor_id}`).emit('queue_updated', { message: `Appointment ${status}` });
    }

    res.json({ message: 'Status updated', appointment: data });
  } catch (error) {
    next(error);
  }
};

exports.callNextPatient = async (req, res, next) => {
  try {
    const { doctor_id } = req.params;
    const queueKey = `doctor:queue:${doctor_id}`;
    
    // Non-blocking pop from queue
    const nextAppointmentId = await redis.lpop(queueKey);
    
    if (!nextAppointmentId) {
      return res.status(404).json({ message: 'Queue is empty' });
    }

    // Update status to 'in_progress'
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'in_progress' })
      .eq('id', nextAppointmentId)
      .select('*, patients(name)')
      .single();

    if (error) throw error;

    const io = req.app.get('io');
    io.to(`doctor_${doctor_id}`).emit('queue_updated', { message: 'Next patient called', current_patient: data });

    res.json({ message: 'Next patient called', appointment: data });
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const { appointment_id } = req.params;
    
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointment_id)
      .select()
      .single();
      
    if (error) throw error;

    const queueKey = `doctor:queue:${data.doctor_id}`;
    await redis.lrem(queueKey, 0, appointment_id);

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorSlots = async (req, res, next) => {
  try {
    const { doctor_id } = req.params;
    const { date } = req.query; // YYYY-MM-DD
    
    if (!date) return res.status(400).json({ error: { message: 'Date is required' } });

    // Mock slots from 09:00 to 17:00
    const allSlots = ['09:00:00', '10:00:00', '11:00:00', '13:00:00', '14:00:00', '15:00:00', '16:00:00'];
    
    const { data, error } = await supabase
      .from('appointments')
      .select('start_time')
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', date)
      .in('status', ['scheduled', 'in_progress', 'completed']);

    if (error) throw error;

    const bookedSlots = data.map(app => app.start_time);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({ date, availableSlots, bookedSlots });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const { doctor_id } = req.params;
    // Mocking AI Recommendation logic
    // In a real scenario, we would call OpenAI API or Gemini API here and pass historical data
    
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const recommendations = [
      {
        slot: '09:00:00',
        date: new Date().toISOString().split('T')[0],
        score: 0.95,
        reason: 'Historically lowest cancellation rate and minimal queue delays for this doctor.'
      },
      {
        slot: '14:00:00',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        score: 0.88,
        reason: 'Post-lunch slots tend to have fewer emergency interruptions based on past 30 days data.'
      }
    ];

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
};
