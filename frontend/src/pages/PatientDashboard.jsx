import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../services/api';
import { Calendar, Clock, Star, ArrowRight, Activity, LogOut } from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [bookingNotice, setBookingNotice] = useState('');
  const [receiptHtml, setReceiptHtml] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token') || user.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchDoctors();
  }, [navigate, user.role]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (error) {
      toast.error('Failed to load doctors');
    }
  };

  const handleSelectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    fetchSlots(doctor.id, bookingDate);
    fetchRecommendations(doctor.id);
  };

  const fetchSlots = async (doctorId, date) => {
    try {
      const res = await api.get(`/doctors/${doctorId}/slots?date=${date}`);
      setSlots(res.data.availableSlots);
    } catch (error) {
      toast.error('Failed to load slots');
    }
  };

  const fetchRecommendations = async (doctorId) => {
    try {
      const res = await api.get(`/doctors/${doctorId}/recommendations`);
      setRecommendations(res.data.recommendations);
    } catch (error) {
      console.error(error);
    }
  };

  const openEmailReceipt = (html) => {
    if (!html) return;
    setReceiptHtml(html);
  };

  const handleBook = async (time) => {
    setLoading(true);
    try {
      const res = await api.post('/appointments', {
        doctor_id: selectedDoctor.id,
        appointment_date: bookingDate,
        start_time: time
      });
      if (res.data.emailReceipt) {
        const notice = 'Appointment booked successfully! Your confirmation receipt is opening.';
        setBookingNotice(notice);
        toast.success(notice, { autoClose: 4000 });
        openEmailReceipt(res.data.emailReceipt);
      } else {
        const notice = 'Appointment booked successfully!';
        setBookingNotice(notice);
        toast.success(notice);
      }
      setTimeout(() => navigate(`/patient/queue/${selectedDoctor.id}`), 1200);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to book');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-8">
        <div className="flex items-center gap-2 text-dark-green font-bold text-xl">
          <Activity className="text-pista-green" /> Welcome, {user.name}
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
          <LogOut size={18} /> Logout
        </button>
      </header>

      {bookingNotice && (
        <div className="mb-6 rounded-2xl border border-pista-green bg-soft-green px-4 py-3 text-dark-green font-semibold">
          {bookingNotice}
        </div>
      )}

      {receiptHtml && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-green">Appointment Confirmation</h3>
              <button
                onClick={() => setReceiptHtml('')}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
            <div className="rounded-2xl border border-gray-200 p-2" dangerouslySetInnerHTML={{ __html: receiptHtml }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-2xl font-bold text-dark-green mb-4">Select a Doctor</h2>
          {doctors.map(doc => (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              key={doc.id} 
              onClick={() => handleSelectDoctor(doc)}
              className={`p-6 rounded-2xl cursor-pointer transition-all border ${selectedDoctor?.id === doc.id ? 'bg-dark-green text-white border-dark-green shadow-lg' : 'bg-white border-gray-100 hover:border-pista-green'}`}
            >
              <h3 className="text-xl font-bold">{doc.name}</h3>
              <p className={selectedDoctor?.id === doc.id ? 'text-pista-green' : 'text-gray-500'}>{doc.specialty}</p>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedDoctor ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 rounded-3xl shadow-xl">
              <h2 className="text-3xl font-bold text-dark-green mb-6">Book Appointment with {selectedDoctor.name}</h2>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <div className="flex items-center gap-4">
                  <Calendar className="text-pista-green" />
                  <input 
                    type="date" 
                    value={bookingDate} 
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      fetchSlots(selectedDoctor.id, e.target.value);
                    }}
                    className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pista-green"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {recommendations.length > 0 && (
                <div className="mb-8 p-6 bg-soft-green rounded-2xl border border-pista-green">
                  <div className="flex items-center gap-2 mb-4 text-dark-green font-bold text-lg">
                    <Star className="text-yellow-500 fill-current" /> AI Recommended Slots
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-dark-green">{rec.date} at {rec.slot}</span>
                          <span className="text-xs font-bold px-2 py-1 bg-light-green text-dark-green rounded-full">{(rec.score * 100).toFixed(0)}% Match</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{rec.reason}</p>
                        <button 
                          disabled={loading}
                          onClick={() => {
                            setBookingDate(rec.date);
                            handleBook(rec.slot);
                          }}
                          className="w-full py-2 bg-pista-green text-dark-green font-bold rounded-lg hover:bg-dark-green hover:text-white transition-colors"
                        >
                          Book This Slot
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-dark-green mb-4 flex items-center gap-2">
                  <Clock size={20} /> Available Slots for {bookingDate}
                </h3>
                {slots.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {slots.map(time => (
                      <button 
                        key={time}
                        disabled={loading}
                        onClick={() => handleBook(time)}
                        className="px-6 py-3 bg-light-green text-dark-green border border-pista-green rounded-xl font-medium hover:bg-dark-green hover:text-white transition-all flex items-center gap-2"
                      >
                        {time} <ArrowRight size={16} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No slots available for this date.</p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white/50 border-2 border-dashed border-pista-green rounded-3xl p-10">
              <p className="text-xl text-gray-500 font-medium">Select a doctor to view available slots and book an appointment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
