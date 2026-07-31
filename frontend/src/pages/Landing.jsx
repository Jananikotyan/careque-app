import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { HeartPulse, Clock, ShieldCheck, Activity } from 'lucide-react';

const Landing = () => {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(textRef.current.children, {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out'
      });
      
      gsap.from(cardsRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        delay: 0.5,
        ease: 'power2.out'
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen flex flex-col" ref={heroRef}>
      <header className="px-8 py-6 flex justify-between items-center bg-white shadow-sm border-b border-soft-green">
        <div className="flex items-center gap-2 text-dark-green font-bold text-2xl">
          <HeartPulse size={32} className="text-pista-green" />
          <span>CareQueue</span>
        </div>
        <nav className="flex gap-4">
          <Link to="/login" className="px-6 py-2 text-dark-green font-medium hover:text-pista-green transition-colors">Login</Link>
          <Link to="/register" className="px-6 py-2 bg-dark-green text-white rounded-full shadow-md hover:bg-pista-green transition-all hover:-translate-y-0.5">Get Started</Link>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-soft-green rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pista-green rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

        <div ref={textRef} className="z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-soft-green text-dark-green font-medium mb-6">
            <Activity size={18} />
            <span>Modern Healthcare Queue Management</span>
          </div>
          <h1 className="text-6xl font-extrabold text-text leading-tight mb-6 tracking-tight">
            Seamless Care, <span className="text-dark-green">Zero Waiting.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Book appointments effortlessly, track your queue position in real-time, and get AI-powered slot recommendations.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-dark-green text-white rounded-full text-lg shadow-lg hover:bg-pista-green transition-all hover:scale-105">Book Appointment</Link>
            <Link to="/login" className="px-8 py-4 bg-white text-dark-green rounded-full text-lg shadow-lg border border-soft-green hover:bg-soft-green transition-all">Doctor Portal</Link>
          </div>
        </div>

        <div ref={cardsRef} className="z-10 mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4">
          {[
            { icon: Clock, title: 'Real-Time Tracking', desc: 'Watch your queue position update live. No more sitting in crowded waiting rooms.' },
            { icon: ShieldCheck, title: 'AI Recommendations', desc: 'Our AI analyzes patterns to suggest the best times with minimal delays.' },
            { icon: HeartPulse, title: 'Premium Care', desc: 'Focus on your health while we handle the logistics of your visit seamlessly.' },
          ].map((feature, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-soft-green rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="text-dark-green" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-dark-green mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;
