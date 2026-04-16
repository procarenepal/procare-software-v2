import { Client, Storage, ID } from "appwrite";

// Get environment variables
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

// Validate required environment variables
if (!APPWRITE_ENDPOINT) {
  throw new Error(
    "VITE_APPWRITE_ENDPOINT is not defined in environment variables",
  );
}

if (!APPWRITE_PROJECT_ID) {
  throw new Error(
    "VITE_APPWRITE_PROJECT_ID is not defined in environment variables",
  );
}

if (!APPWRITE_BUCKET_ID) {
  throw new Error(
    "VITE_APPWRITE_BUCKET_ID is not defined in environment variables",
  );
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize storage
const storage = new Storage(client);

export { client, storage, APPWRITE_BUCKET_ID, ID };
