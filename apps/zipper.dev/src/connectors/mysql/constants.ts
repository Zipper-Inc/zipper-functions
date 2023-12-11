export const code = `import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import * as sql from "https://esm.sh/sql-bricks";

// Define a function to load configuration from the environment
function loadConfig() {
  return {
    hostname: Deno.env.get("MYSQL_HOST"),
    username: Deno.env.get("MYSQL_USERNAME"),
    db: Deno.env.get("MYSQL_DATABASE"),
    password: Deno.env.get("MYSQL_PASSWORD"), 
  };
}

// Initialize a new Mysql client
const config = loadConfig();
const client = new Client();

// Wrap connection logic in an async function
async function connectClient() {
  await client.connect({config});
}

// Call the connectClient function
connectClient().catch(console.error);

// Function to execute a query using sql-bricks
async function executeQuery(
  query:
    | sql.SelectStatement
    | sql.InsertStatement
    | sql.UpdateStatement
    | sql.DeleteStatement
) {
  const queryString = query.toString();
  try {
    const result = await client.execute(queryString);
    return result.rows;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

// Example function to query data
async function getDataFromTable(tableName: string) {
  const query = sql.select("*").from(tableName);
  return await executeQuery(query);
}

export { executeQuery, getDataFromTable };
`;
