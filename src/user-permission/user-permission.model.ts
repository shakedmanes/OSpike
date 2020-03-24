// userPermission.model

import { Schema, model } from 'mongoose';
import { IUserPermission, collectionName } from './user-permission.interface';
import { collectionName as ClientModelName } from '../client/client.interface';
import { clientRefValidator } from '../client/client.validator';
import { collectionName as ScopeModelName } from '../scope/scope.interface';
import { scopeRefValidator } from '../scope/scope.validator';

const userPermissionSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: ClientModelName,
    required: true,
    validate: clientRefValidator as any,
  },
  scopeId: {
    type: Schema.Types.ObjectId,
    ref: ScopeModelName,
    required: true,
    validate: scopeRefValidator as any,
  },
});

// Ensures there's only one unique scope value for unique client (by audienceId field)
userPermissionSchema.index({ userId: 1, clientId: 1, scopeId: 1 }, { unique: true });

const userPermissionModel = model<IUserPermission>(collectionName, userPermissionSchema);

export default userPermissionModel;
