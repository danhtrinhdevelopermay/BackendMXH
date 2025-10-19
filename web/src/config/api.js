const API_URL = typeof window !== 'undefined' && window.API_URL 
  ? window.API_URL 
  : process.env.REACT_APP_API_URL || 'http://localhost:5000';

export { API_URL };
export default API_URL;
