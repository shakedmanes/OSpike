// app

import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import express, { NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import './passport_config'; // Setting up all passport middlewares
import './db_config'; // Create mongodb connections
import { default as session } from 'express-session';
import { default as oauthRouter } from './oauth2/oauth2.routes';
import { default as wellKnownRouter } from './certs/certs.routes';
import { errorHandler } from './utils/error.handler';
import { log, parseLogData, LOG_LEVEL } from './utils/logger';
import config from './config';
import { writeFileSync } from 'fs';

const app = express();

// Morgan formatting types for each environment
const morganFormatting: any = { prod: 'common', dev: 'dev', test: 'tiny' };

// Set ejs as view engine for server side rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Static files middleware
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Middlewares
app.set('port', process.env.PORT);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(morganFormatting[process.env.NODE_ENV || 'dev']));

// Use express session support since OAuth2orize requires it
app.use(session({
  secret: config.SESSION_SECRET,
  saveUninitialized: true,
  resave: true,
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

/* Routes */

// OAuth2 routes
app.use(config.OAUTH_ENDPOINT, oauthRouter);

// Well known routes
app.use(config.WELLKNOWN_ENDPOINT, wellKnownRouter);

// Error handler
app.use(errorHandler);

// Health check for Load Balancer
app.get('/health', (req, res) => res.send('alive'));

app.get('/auth/shraga', passport.authenticate('shraga'));
app.post(
  '/auth/callback',
  passport.authenticate('shraga'),
  (req: any, res: any, next: NextFunction) => {
    res.redirect(
      `/oauth2/authorize?${Buffer.from(req.user.RelayState, 'base64').toString('utf8')}`,
    );
  },
);

// Handling all unknown route request with 404
app.all('*', (req, res) => {
  log(
    LOG_LEVEL.INFO,
    parseLogData(
      'Unknown Route Request',
      `Received from ${req.headers['x-forwarded-for']}, Operation - ${req.method}. ${'\r\n'
      }Route Name: ${req.originalUrl}`,
      404,
      null,
    ),
  );
  res.status(404).send({ message: `Page not found` });
});

export default app;
