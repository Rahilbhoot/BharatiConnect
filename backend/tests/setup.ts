import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer: MongoMemoryServer | null = null;

export async function connectTestDb() {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err: any) {
    console.warn('MongoMemoryServer startup failed, using fallback test database:', err?.message);
    const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    const testUri = baseUri.endsWith('/') ? `${baseUri}bharaticonnect_test` : `${baseUri}/bharaticonnect_test`;
    await mongoose.connect(testUri);
  }
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export async function clearTestDb() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
