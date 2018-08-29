// generic.validator

import { model as getModel } from 'mongoose';

/**
 * Reference validator for model - checks if the reference used actually exist in the db.
 * @param modelName - the name of the model
 * @param idField - the unique id field of the model
 * @param idValue - the value of the unique id field
 */
export const refValidator = async (modelName: string, idField: string, idValue: any) => {
  const modelExist = await getModel(modelName).findOne({ [idField]: idValue });
  return !!modelExist;
};

// TODO: Check about unique indexes in mongoose for giveaway this lazy validator
/**
 * Unique validator for model - checks if there's only one model like that in the db.
 * @param modelName - the name of the model
 * @param idField - the unique id field of the model
 * @param idValue - the value of the unique id field
 */
export const uniqueValidator = async (modelName: string, idField: string, idValue: string) => {
  const modelCount = await getModel(modelName).count({ [idField]: idValue });
  return (modelCount === 0);
};
