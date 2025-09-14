import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';

  await mongoose.connect(uri, {
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
