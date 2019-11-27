// scope.model

import { Schema, model } from 'mongoose';
import { collectionName as ClientModelName } from '../client/client.interface';
import { IScope, collectionName } from './scope.interface';
import { clientRefValidator, clientRefValidatorByAudId } from '../client/client.validator';

const scopeSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
    },
    audienceId: {
      type: String,
      ref: ClientModelName,
      required: true,
      validate: clientRefValidatorByAudId as any,
    },
    permittedClients: {
      type: [{ type: Schema.Types.ObjectId, ref: ClientModelName, validate: clientRefValidator }],
      required: true,
      default: [],
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

// Ensures there's only one unique scope value for unique client (by audienceId field)
scopeSchema.index({ value: 1, audienceId: 1 }, { unique: true });

// TODO: Create an pre/post hook when adding client to permitted clients array, so the client
//       'scopes' array will also contain that scope due the addition permission for that scope

// Virtual field for audience client validations and population
scopeSchema.virtual('audienceClient', {
  ref: ClientModelName,
  localField: 'audienceId',
  foreignField: 'audienceId',
  justOne: true,
});

const scopeModel = model<IScope>(collectionName, scopeSchema);

export default scopeModel;
