const supabase = require('../config/supabase');

exports.getAllPatients = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, email');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
};
