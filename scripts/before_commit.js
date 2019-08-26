/** 
 * Before commit script, use before commit to delete important project credentials
 * from being published on git platform, and save them into file for after commit script
 * to import them after the commit.
 */
const fs = require('fs');
const pathJoin = require('path').join;
const config = require('./config');
const pkgJsonFile = require('../package.json');

function beforeCommit() {
  const envsConfigurations = {};

  for (scriptName of config.scriptsContainsCredentials) {
    envsConfigurations[scriptName] = {};    
    const modifiedScriptValue = pkgJsonFile.scripts[scriptName].split(' ');

    for (deleteCred of Object.keys(config.credentailsToDelete)) {
      const index = modifiedScriptValue.indexOf(deleteCred) + 1;

      if (index) {
        envsConfigurations[scriptName][deleteCred] = modifiedScriptValue[index];
        modifiedScriptValue[index] = config.credentailsToDelete[deleteCred];        
      }
    }

    pkgJsonFile.scripts[scriptName] = modifiedScriptValue.join(' ');
  }

  fs.writeFileSync(pathJoin(__dirname, '../package.json'), JSON.stringify(pkgJsonFile, null, 2));  
  fs.writeFileSync(pathJoin(__dirname, '../', config.afterCommitFile), JSON.stringify(envsConfigurations, null, 2));
}

beforeCommit();