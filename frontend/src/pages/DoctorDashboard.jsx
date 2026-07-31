import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import api from '../services/api';
import { Users, CheckCircle, XCircle, ArrowRight, Activity, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token') || user.role !== 'doctor') {
      navigate('/login');
      return;
    }
    
    fetchQueue();

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_doctor_room', user.id);
    
    socket.on('queue_updated', (data) => {
      if (data.message) toast.info(data.message);
      if (data.current_patient) setCurrentPatient(data.current_patient);
      fetchQueue();
    });

    return () => socket.disconnect();
  }, [navigate, user.id, user.role]);

  const fetchQueue = async () => {
    try {
      const res = await api.get(`/doctors/${user.id}/queue`);
      setQueue(res.data.queue || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCallNext = async () => {
    try {
      const res = await api.get(`/doctors/${user.id}/next`);
      setCurrentPatient(res.data.appointment);
      toast.success(`Called next patient: ${res.data.appointment.patients?.name || 'Unknown'}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to call next patient');
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!currentPatient) return;
    try {
      await api.patch(`/appointments/${currentPatient.id}/status`, { status });
      toast.success(`Patient marked as ${status}`);
      setCurrentPatient(null);
      fetchQueue();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen p-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-8 border border-soft-green">
        <div className="flex items-center gap-2 text-dark-green font-bold text-xl">
          <Activity className="text-pista-green" /> Dr. {user.name}'s Dashboard
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-soft-green min-h-[300px] flex flex-col justify-center items-center text-center">
            {currentPatient ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
                <div className="inline-block px-4 py-1 bg-red-100 text-red-600 font-bold rounded-full text-sm mb-6 animate-pulse">
                  IN PROGRESS
                </div>
                <h2 className="text-4xl font-black text-dark-green mb-2">{currentPatient.patients?.name}</h2>
                <p className="text-gray-500 text-lg mb-8">Slot: {currentPatient.start_time}</p>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => handleUpdateStatus('completed')}
                    className="flex items-center gap-2 px-8 py-4 bg-dark-green text-white rounded-full font-bold shadow-lg hover:bg-pista-green transition-all"
                  >
                    <CheckCircle size={20} /> Mark Completed
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('cancelled')}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-red-500 border border-red-200 rounded-full font-bold shadow-sm hover:bg-red-50 transition-all"
                  >
                    <XCircle size={20} /> Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-soft-green rounded-full flex items-center justify-center mb-6">
                  <Users className="text-dark-green" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-400 mb-6">No patient currently in session</h2>
                <button 
                  onClick={handleCallNext}
                  disabled={queue.length === 0}
                  className="flex items-center gap-2 px-8 py-4 bg-dark-green text-white rounded-full font-bold shadow-lg hover:bg-pista-green transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Call Next Patient <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-soft-green h-full">
            <h3 className="text-xl font-bold text-dark-green mb-6 flex justify-between items-center">
              <span>Patient Queue</span>
              <span className="bg-soft-green text-dark-green px-3 py-1 rounded-full text-sm">{queue.length} Waiting</span>
            </h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {queue.length > 0 ? (
                queue.map((app, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                    key={app.id} 
                    className="p-4 bg-light-green border border-pista-green rounded-2xl flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-text">{app.patients?.name || 'Patient'}</h4>
                      <p className="text-sm text-gray-500">Slot: {app.start_time}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-dark-green font-bold flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-gray-400 italic py-10">The queue is empty.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
