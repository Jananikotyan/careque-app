import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../services/api';
import { HeartPulse } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', role: 'patient' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Welcome back!');
      if (res.data.user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/patient/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-dark-green font-bold text-xl">
        <HeartPulse size={24} className="text-pista-green" /> CareQueue
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-dark-green mb-2">Welcome Back</h2>
          <p className="text-gray-500">Sign in to manage your appointments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2 p-1 bg-soft-green rounded-xl mb-6">
            <button type="button" onClick={() => setFormData({...formData, role: 'patient'})} className={`flex-1 py-2 rounded-lg font-medium transition-all ${formData.role === 'patient' ? 'bg-white shadow text-dark-green' : 'text-gray-600 hover:text-dark-green'}`}>Patient</button>
            <button type="button" onClick={() => setFormData({...formData, role: 'doctor'})} className={`flex-1 py-2 rounded-lg font-medium transition-all ${formData.role === 'doctor' ? 'bg-white shadow text-dark-green' : 'text-gray-600 hover:text-dark-green'}`}>Doctor</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pista-green bg-gray-50" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pista-green bg-gray-50" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          
          <button disabled={loading} className="w-full py-4 bg-dark-green text-white rounded-xl font-bold text-lg shadow-lg hover:bg-pista-green transition-all mt-4">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account? <Link to="/register" className="text-dark-green font-bold hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
