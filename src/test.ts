import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';
import config from './config';

/**
 * Deletes all collections in the db
 */
export const deleteCollections = async () => {
  const deletePromises = [];

  for (const index in mongoose.connection.collections) {
    deletePromises.push(mongoose.connection.collections[index].remove({}));
  }

  await Promise.all(deletePromises);
};

/**
 * Gets property name from interface safely with type checking.
 * @param name - name of the property
 */
export const propertyOf = <T>(name: keyof T) => name;

// Runs before all the test cases for global configuration
before(async () => {
  // Use chai as promised syntax in all tests
  chai.use(chaiAsPromised);

  try {
    await mongoose.connect(config.mongoUrlTest);
    console.log('MongoDB Connection Established');
    await deleteCollections();
    console.log('Deleted all collections found');
  } catch (err) {
    console.error(err);
    process.exit();
  }
});

after(async () => {
  await mongoose.disconnect();
});
