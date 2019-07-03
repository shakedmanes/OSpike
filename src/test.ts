import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mongoose from 'mongoose';
import config from './config';

/**
 * Delete all collections in the db (Or specific ones if specified)
 * @param [specificCollections] - Specific collections to delete instead of all collections.
 */
export const deleteCollections = async (specificCollections?: string[]) => {
  const deletePromises = [];
  const collectionsToDelete = specificCollections || Object.keys(mongoose.connection.collections);

  for (const collection of collectionsToDelete) {
    if (mongoose.connection.collections[collection]) {
      deletePromises.push(mongoose.connection.collections[collection].remove({}));
    }
  }

  await Promise.all(deletePromises);
};

// Runs before all the test cases for global configuration
before(async () => {

  if (process.env.NODE_ENV !== 'test') {
    console.log('\x1B[31m WARNING:\x1B[0m Invalid node environment when running tests.');
    process.exit();
  }

  // Use chai as promised syntax in all tests
  chai.use(chaiAsPromised);

  try {
    await mongoose.connect(config.mongoUrl);
    console.log('[*] MongoDB Connection Established [*]');
    await deleteCollections();
    console.log('[*] Deleted all collections found [*]');
  } catch (err) {
    console.error(err);
    process.exit();
  }
});

after(async () => {
  await mongoose.disconnect();
});
