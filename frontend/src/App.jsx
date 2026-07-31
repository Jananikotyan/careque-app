import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import QueueTracking from './pages/QueueTracking';
import FloatingChatbot from './components/FloatingChatbot';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-light-green text-text font-sans">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/queue/:doctorId" element={<QueueTracking />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
        <FloatingChatbot />
      </div>
    </Router>
  );
}

export default App;
