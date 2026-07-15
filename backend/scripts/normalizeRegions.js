require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../db');
const Project = require('../models/Project');

const REGION_MAP = {
  'CH':          'Suisse',
  'ch':          'Suisse',
  'Switzerland': 'Suisse',
  'switzerland': 'Suisse',
  'FR':          'France',
  'fr':          'France',
};

async function run() {
  await connectDB(process.env.MONGO_URI);

  const regions = await Project.distinct('projectMeta.region');
  console.log('Régions actuelles en base :', regions);

  for (const [from, to] of Object.entries(REGION_MAP)) {
    const result = await Project.updateMany(
      { 'projectMeta.region': from },
      { $set: { 'projectMeta.region': to } }
    );
    if (result.modifiedCount > 0) {
      console.log(`"${from}" → "${to}" : ${result.modifiedCount} projet(s) mis à jour`);
    }
  }

  const after = await Project.distinct('projectMeta.region');
  console.log('Régions après normalisation :', after);

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
