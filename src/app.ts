import express from 'express';
import morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

// Gets all configuration properties
dotenv.config();

const app = express();

// Middlewares
app.set('port', process.env.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV || 'dev'));

// Routes

export default app;
