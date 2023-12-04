export const code = `
import { MongoClient } from "https://deno.land/x/mongo@v0.20.0/mod.ts";

// Define a function to load configuration from the environment
function loadConfig(): string {
  const config = Deno.env.get("MONGODB_CONNECTION_STRING");
  if (!config) {
    throw new Error("MONGODB_CONNECTION_STRING is not set in the environment");
  }
  return config;
}

// Initialize a new MongoDB client
const config = loadConfig();
const client = new MongoClient();

// Wrap connection logic in an async function
async function connectClient() {
  await client.connect(config);
  return client;
}

// Function to execute a query
async function executeQuery(collectionName: string, query: Record<string, unknown>) {
  const db = client.database("yourDatabaseName"); // Replace with your database name
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
async function getDataFromCollection(collectionName: string) {
  return await executeQuery(collectionName, {});
}

// Initialize the connection and perform operations
async function main() {
  await connectClient().catch(console.error);
  // Example usage
  const data = await getDataFromCollection("yourCollectionName"); // Replace with your collection name
  console.log(data);
}

main().catch(console.error);

export { executeQuery, getDataFromCollection };
`;
