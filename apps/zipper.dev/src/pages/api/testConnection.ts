import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import mysql from 'mysql2/promise';

type DBConfig = {
  connectionString: string;
};

type DatabaseClient = {
  connect: (config: DBConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  testQuery: () => Promise<void>;
};

let postgresPool: Pool | null = null;

async function testDatabaseConnection(
  client: DatabaseClient,
  config: DBConfig,
): Promise<boolean> {
  try {
    await client.connect(config);
    await client.testQuery();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    await client.disconnect();
  }
}
const postgresClient: DatabaseClient = {
  connect: async (config) => {
    postgresPool = new Pool({ connectionString: config.connectionString });
  },
  disconnect: async () => {
    if (postgresPool) {
      await postgresPool.end();
      postgresPool = null;
    }
  },
  testQuery: async () => {
    if (!postgresPool) {
      throw new Error('Postgres pool has not been initialized');
    }
    await postgresPool.query('SELECT NOW()');
  },
};

let mongoClientInstance: MongoClient | null = null;

const mongoClient: DatabaseClient = {
  connect: async (config) => {
    mongoClientInstance = new MongoClient(config.connectionString);
    await mongoClientInstance.connect();
  },
  disconnect: async () => {
    if (mongoClientInstance) {
      await mongoClientInstance.close();
      mongoClientInstance = null;
    }
  },
  testQuery: async () => {
    if (!mongoClientInstance) {
      throw new Error('MongoDB client has not been initialized');
    }
    await mongoClientInstance.db().command({ ping: 1 });
  },
};

let mysqlConnection: mysql.Connection | null = null;

const mysqlClient: DatabaseClient = {
  connect: async (config) => {
    mysqlConnection = await mysql.createConnection(config.connectionString);
  },
  disconnect: async () => {
    if (mysqlConnection) {
      await mysqlConnection.end();
      mysqlConnection = null;
    }
  },
  testQuery: async () => {
    if (!mysqlConnection) {
      throw new Error('MySQL connection has not been initialized');
    }
    await mysqlConnection.query('SELECT 1');
  },
};

// Map of database types to their respective clients
const dbClients: Record<string, DatabaseClient> = {
  postgres: postgresClient,
  mongodb: mongoClient,
  mysql: mysqlClient,
};

// API Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { connectionString, dbType } = req.body;
  const client = dbClients[dbType];

  if (!client) {
    return res.status(400).json({ message: 'Unsupported database type' });
  }

  const config: DBConfig = { connectionString };
  const connectionSuccessful = await testDatabaseConnection(client, config);

  if (connectionSuccessful) {
    res.status(200).json({ message: 'Connection successful' });
  } else {
    res.status(500).json({ message: 'Connection failed' });
  }
}
