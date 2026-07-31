const crypto = require('crypto');
const logger = require('./logger');
const dotenv = require('dotenv');

dotenv.config();

// If the user actually provided a real Supabase URL and it's not the default local one, use the real client
if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('localhost:54321')) {
  const { createClient } = require('@supabase/supabase-js');
  module.exports = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
  logger.info('Using real Supabase Client');
} else {
  // Otherwise, use a fully functional in-memory Mock to prevent TypeError: fetch failed
  logger.info('Using in-memory Supabase Mock (No real Supabase configured)');
  
  const db = {
    patients: [],
    doctors: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Dr. Gregory House',
        specialty: 'Diagnostic Medicine',
        email: 'house@example.com',
        password_hash: '$2a$12$R9h/cIPz0gi.URNNX3rub.FdRQteXmG6C9F5p./6G5q2o2.O0G.m2' // password123
      }
    ],
    appointments: []
  };

  class QueryBuilder {
    constructor(table) {
      this.table = table;
      this.data = [...db[table]];
      this.action = 'select';
      this.singleMode = false;
      this.insertData = null;
      this.updateData = null;
    }

    insert(arr) {
      this.action = 'insert';
      this.insertData = { ...arr[0], id: crypto.randomUUID(), created_at: new Date() };
      return this;
    }

    update(obj) {
      this.action = 'update';
      this.updateData = obj;
      return this;
    }

    select(cols) {
      return this;
    }

    eq(key, val) {
      this.data = this.data.filter(item => item[key] === val);
      return this;
    }

    in(key, vals) {
      this.data = this.data.filter(item => vals.includes(item[key]));
      return this;
    }

    order(key, { ascending }) {
      this.data.sort((a, b) => ascending ? a[key] - b[key] : b[key] - a[key]);
      return this;
    }

    single() {
      this.singleMode = true;
      return this;
    }

    async then(resolve, reject) {
      try {
        let result;
        if (this.action === 'insert') {
          db[this.table].push(this.insertData);
          result = this.singleMode ? this.insertData : [this.insertData];
        } else if (this.action === 'update') {
          this.data.forEach(item => {
            Object.assign(item, this.updateData);
          });
          result = this.singleMode ? this.data[0] : this.data;
        } else {
          if (this.table === 'appointments') {
            this.data = this.data.map(app => {
              const p = db.patients.find(pt => pt.id === app.patient_id);
              return { ...app, patients: p ? { name: p.name } : { name: 'Unknown' } };
            });
          }
          result = this.singleMode ? (this.data.length > 0 ? this.data[0] : null) : this.data;
        }
        resolve({ data: result, error: null });
      } catch (err) {
        resolve({ data: null, error: err });
      }
    }
  }

  module.exports = {
    from: (table) => new QueryBuilder(table)
  };
}
