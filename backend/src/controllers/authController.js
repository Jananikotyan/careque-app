const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_hospital';

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, specialty } = req.body;
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    let user;
    let table = role === 'doctor' ? 'doctors' : 'patients';
    
    const insertData = { name, email, password_hash };
    if (role === 'doctor' && specialty) insertData.specialty = specialty;

    const { data, error } = await supabase
      .from(table)
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    
    const token = jwt.sign({ id: data.id, role }, JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ message: 'Registration successful', token, user: { id: data.id, name: data.name, role } });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    let table = role === 'doctor' ? 'doctors' : 'patients';

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const isValid = await bcrypt.compare(password, data.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const token = jwt.sign({ id: data.id, role }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ token, user: { id: data.id, name: data.name, role } });
  } catch (error) {
    next(error);
  }
};
