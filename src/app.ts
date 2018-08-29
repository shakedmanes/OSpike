// app

import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import passport from 'passport';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import './passport_config'; // Setting up all passport middlewares
import './db_config'; // Create mongodb connections
import { default as session } from 'express-session';
import { default as oauthRouter } from './oauth2/oauth2.routes';
import config from './config';

// Gets all configuration properties
dotenv.config();

const app = express();

// Set ejs as view engine for server side rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Middlewares
app.set('port', process.env.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV || 'dev'));

// Use express session support since OAuth2orize requires it
app.use(session({
  secret: config.SESSION_SECRET,
  saveUninitialized: true,
  resave: true,
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/oauth2', oauthRouter);

// TODO: Add login route for authentication of the user

export default app;
