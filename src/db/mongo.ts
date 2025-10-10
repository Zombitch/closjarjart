import mongoose from 'mongoose';
import env from '../core/env';

export async function connectMongo() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    appName: 'closjarjart-app',
  });

  mongoose.connection.on('connected', () => {
    console.log('✅ Mongo connecté');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Erreur connexion Mongo :', err);
    process.exit(1);
  });
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
