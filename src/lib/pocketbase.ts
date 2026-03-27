import PocketBase from 'pocketbase';

// Initialize PocketBase singleton
const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8080',
);

export default pb;
