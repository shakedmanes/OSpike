// db_config

import mongoose from 'mongoose';
import config from './config';

mongoose.connect(config.mongoUrl, (err) => {
  if (err) {
    console.error('Error connnecting to mongoose');
    console.error(err);
    process.exit();
  }

  console.log('MongoDB Connection Established');
});
