const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 1000
});

const getCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

const get = (key) => {
  return cache.get(key);
};

const set = (key, value, ttl = 300) => {
  return cache.set(key, value, ttl);
};

const del = (keys) => {
  if (Array.isArray(keys)) {
    return cache.del(keys);
  }
  return cache.del([keys]);
};

const delPattern = (pattern) => {
  const keys = cache.keys().filter(key => key.startsWith(pattern));
  if (keys.length > 0) {
    return cache.del(keys);
  }
  return 0;
};

const flush = () => {
  return cache.flushAll();
};

module.exports = {
  cache,
  getCacheKey,
  get,
  set,
  del,
  delPattern,
  flush
};
