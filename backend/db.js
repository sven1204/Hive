const mongoose = require('mongoose');

let isConnected = false;

function normalizeMongoUri(uri) {
  if (!uri || !uri.startsWith('mongodb')) {
    return uri;
  }

  try {
    const parsed = new URL(uri);
    if (!parsed.password) {
      return uri;
    }

    const encodedPassword = encodeURIComponent(decodeURIComponent(parsed.password));
    if (parsed.password === encodedPassword) {
      return uri;
    }

    parsed.password = encodedPassword;
    return parsed.toString();
  } catch (_error) {
    const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.*)$/);
    if (!match) {
      return uri;
    }

    const [, prefix, username, password, suffix] = match;
    return `${prefix}${username}:${encodeURIComponent(password)}@${suffix}`;
  }
}

//fonction async pour attendre que la base soit connecté 
async function connectDB(uri) {
  if (isConnected) return mongoose.connection;
  mongoose.set('strictQuery', true);
  const normalizedUri = normalizeMongoUri(uri);
  console.log("MONGO URI utilisée :", normalizedUri);

  await mongoose.connect(normalizedUri, {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[DB] disconnected');
  });

  console.log('MongoDB connecté');
  return mongoose.connection;
}

async function closeDB() {
  await mongoose.connection.close();
  isConnected = false;
  console.log('MongoDB fermé');
}

module.exports = { connectDB, closeDB };
