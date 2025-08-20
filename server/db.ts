import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
let mongoMemoryServer: any | null = null;

export const connectToDatabase = async () => {
  try {
    // If already connected or connecting, do nothing
    if (mongoose.connection.readyState !== 0) return;

    let connectionUri = process.env.MONGODB_URI;

    // In development, fall back to an in-memory MongoDB if no URI is provided
    if (!connectionUri && process.env.NODE_ENV === 'development') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      connectionUri = mongoMemoryServer.getUri();
      console.log('Started in-memory MongoDB for development');
    }

    if (!connectionUri) {
      throw new Error(
        'MONGODB_URI must be set. Please provide your MongoDB Atlas connection string.',
      );
    }

    await mongoose.connect(connectionUri, { dbName: 'ideofuzion' });
    console.log('Connected to MongoDB - ideofuzion database');
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
};

export const disconnectFromDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
    console.log('Stopped in-memory MongoDB server');
  }
};
