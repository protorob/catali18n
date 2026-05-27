import PocketBase from 'pocketbase';

// Initialize the PocketBase client.
// Falls back to http://127.0.0.1:8090 if the environment variable is not defined.
export const pb = new PocketBase(
  import.meta.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
);
