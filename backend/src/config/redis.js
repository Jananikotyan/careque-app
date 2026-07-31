const logger = require('./logger');

class RedisMock {
  constructor() {
    this.store = new Map();
    this.lists = new Map();
    this.timers = new Map();
    logger.info('Using in-memory Redis Mock (No local Redis detected)');
  }

  async setnx(key, value) {
    if (this.store.has(key)) return 0;
    this.store.set(key, value);
    return 1;
  }

  async expire(key, seconds) {
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, seconds * 1000);
    this.timers.set(key, timer);
    return 1;
  }

  async del(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.store.delete(key) ? 1 : 0;
  }

  async rpush(key, value) {
    if (!this.lists.has(key)) this.lists.set(key, []);
    const list = this.lists.get(key);
    list.push(value);
    return list.length;
  }

  async llen(key) {
    const list = this.lists.get(key);
    return list ? list.length : 0;
  }

  async lrange(key, start, end) {
    const list = this.lists.get(key);
    if (!list) return [];
    if (end === -1) return list.slice(start);
    return list.slice(start, end + 1);
  }

  async lrem(key, count, value) {
    const list = this.lists.get(key);
    if (!list) return 0;
    
    let removed = 0;
    // Simple mock: removes all occurrences (count=0 logic)
    const newList = list.filter(item => {
      if (item === value) {
        removed++;
        return false;
      }
      return true;
    });
    this.lists.set(key, newList);
    return removed;
  }

  async lpop(key) {
    const list = this.lists.get(key);
    if (!list || list.length === 0) return null;
    return list.shift();
  }

  on(event, handler) {
    // No-op for mock
  }
}

module.exports = new RedisMock();
