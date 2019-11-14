// db_config

import mongoose from 'mongoose';
import config from './config';
import { LOG_LEVEL, log, parseLogData } from './utils/logger';

mongoose.connect(config.mongoUrl, (err) => {
  if (err) {
    log(
      LOG_LEVEL.ERROR,
      parseLogData(
        err.name || 'Error MongoDB Connection',
        `Error connecting to mongo server, received: ${err.message || err}`,
        null,
        err.stack,
      ),
    );

    console.error('Error connnecting to mongoose');
    console.error(err);
    process.exit();
  }

  log(
    LOG_LEVEL.INFO,
    parseLogData(
      'MongoDB Connection Established',
      `MongoDB connection established - mongo url: ${config.mongoUrl}`,
      null,
    ),
  );

  console.log('MongoDB Connection Established');
});
