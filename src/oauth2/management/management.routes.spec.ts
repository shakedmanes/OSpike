// management.routes.spec

import { expect } from 'chai';
import * as mongoose from 'mongoose';
import { default as request }  from 'supertest';
import { IClientInformation, IClientBasicInformation } from './management.interface';
import clientModel from '../../client/client.model';
import { deleteCollections, propertyOf } from '../../test';
// import { app } from '../../app';
import config from '../../config';

describe.skip('Client Management Routes Functionality', () => {

  const registerEndpoint = '/register';

  const validClientInformation: IClientBasicInformation =  {
    name: 'TestName',
    hostUri: 'https://test.com',
    redirectUris: ['https://test.com/callback'],
  };

  let clientRegistrer = new clientModel({
    name: 'ClientRegistrer',
    hostUri: 'https://client.register.com',
    redirectUris: ['https://client.register.com/callback'],
    scopes: [config.CLIENT_MANAGER_SCOPE],
  });

  let notClientRegistrer = new clientModel({
    name: 'ClientRegistrer',
    hostUri: 'https://client.register.com',
    redirectUris: ['https://client.register.com/callback'],
    scopes: [config.CLIENT_MANAGER_SCOPE],
  });

  before(async () => {
    // Delete all collections before test suite
    await deleteCollections();

    clientRegistrer = await clientRegistrer.save();
    notClientRegistrer = await notClientRegistrer.save();
  });

  after(async () => {
    await deleteCollections();
  });

  describe('(Register Client) - /register', () => {

    it('Should register client by client manager that does have permissions', () => {

    });
    it('Should not register client by client manager that doesn\'t have permissions', () => {

    });

    it('Should not register client without data by client manager that does have permissions',
       () => {

       },
     );
  });

  describe('(Read Client) - /register/:id', () => {
    it('Should read existing client information by client manager that does have permissions',
       () => {

       },
    );

    it(`Should not read existing client information by
       client manager that doesn\'t have permissions`,
       () => {

       },
    );

    it('Should not read unexisting client information by client manager that does have permissions',
       () => {

       },
    );

    it(`Should not read client information without specifing
         client id by client manager that does have permissions`,
    );
  });

  describe('(Update Client) - /register/:id', () => {

    it('Should update existing client information by client manager that does have permissions',
       () => {

       },
    );

    it(`Sohuld not update existing client information by
        client manager that doesn\'t have permissions`,
       () => {

       },
     );

    it(`Should not update unexisting client information
        by client manager that does have permissions`,
       () => {

       },
     );
  });

});
