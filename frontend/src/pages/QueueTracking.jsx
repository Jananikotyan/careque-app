import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { ArrowLeft, Clock, Activity } from 'lucide-react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const QueueTracking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [queuePos, setQueuePos] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token') || user.role !== 'patient') {
      navigate('/login');
      return;
    }

    fetchMyPosition();

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join_doctor_room', doctorId);
    
    socket.on('queue_updated', (data) => {
      if (data.message) toast.info(data.message);
      fetchMyPosition();
    });

    return () => socket.disconnect();
  }, [doctorId, navigate, user.role]);

  const fetchMyPosition = async () => {
    try {
      const res = await api.get(`/doctors/${doctorId}/queue`);
      const queue = res.data.queue || [];
      const myAppointment = queue.findIndex(app => app.patient_id === user.id);
      
      if (myAppointment !== -1) {
        setQueuePos(myAppointment + 1);
      } else {
        setQueuePos(0); // Means it's their turn or completed
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const estimatedWaitTime = queuePos ? queuePos * 15 : 0; // 15 mins per patient

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-dark-green font-bold text-xl animate-pulse">Loading Queue Data...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col p-6 items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pista-green rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-soft-green rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

      <div className="z-10 w-full max-w-2xl bg-white/80 backdrop-blur-lg p-10 rounded-[3rem] shadow-2xl border border-white text-center">
        <button onClick={() => navigate('/patient/dashboard')} className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-dark-green transition-colors">
          <ArrowLeft size={20} /> Back
        </button>

        <Activity size={48} className="mx-auto text-pista-green mb-6" />
        
        {queuePos > 0 ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8">
            <h2 className="text-3xl font-bold text-dark-green">Your Queue Position</h2>
            <div className="text-[8rem] font-black text-dark-green leading-none">
              {queuePos}
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xl text-gray-600 bg-light-green py-4 px-8 rounded-full w-max mx-auto border border-pista-green">
              <Clock className="text-dark-green" /> 
              <span>Est. Wait Time: <span className="font-bold text-dark-green">{estimatedWaitTime} mins</span></span>
            </div>
            <p className="text-gray-500">Please remain in the waiting area. The doctor will see you soon.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 py-10">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <ArrowLeft size={40} className="-rotate-90" />
            </div>
            <h2 className="text-4xl font-black text-dark-green">It's Your Turn!</h2>
            <p className="text-xl text-gray-600">Please proceed to the doctor's cabin.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QueueTracking;
