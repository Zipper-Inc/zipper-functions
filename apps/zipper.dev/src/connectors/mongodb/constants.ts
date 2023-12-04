export const code = `import { MongoClient } from "https://deno.land/x/mongo@v0.20.0/mod.ts";

// Define a function to load configuration from the environment
function loadConfig() {
  return Deno.env.get("MONGODB_CONNECTION_STRING");
}

// Initialize a new MongoDB client
const config = loadConfig();
const client = new MongoClient();

// Wrap connection logic in an async function
async function connectClient() {
  await client.connect(config);
  return client;
}

// Call the connectClient function and store the database reference
const db = await connectClient().catch(console.error);

// Function to execute a query
async function executeQuery(collectionName, query) {
  const collection = db.collection(collectionName);
  try {
    const result = await collection.find(query).toArray();
    return result;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Example function to query data
async function getDataFromCollection(collectionName) {
  return await executeQuery(collectionName, {});
}

export { executeQuery, getDataFromCollection };
`;
