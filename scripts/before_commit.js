/** 
 * Before commit script, use before commit to delete important project credentials
 * from being published on git platform.
 */
const fs = require('fs');
const pathJoin = require('path').join;
const config = require('./config');
const pkgJsonFile = require('../package.json');

function beforeCommit() {
  for (scriptName of config.scriptsContainsCredentials) {
    const modifiedScriptValue = pkgJsonFile.scripts[scriptName].split(' ');
    for (deleteCred of Object.keys(config.credentailsToDelete)) {
      const index = modifiedScriptValue.indexOf(deleteCred) + 1;
      modifiedScriptValue[index] = config.credentailsToDelete[deleteCred]
    }
    pkgJsonFile.scripts[scriptName] = modifiedScriptValue.join(' ');
  }

  fs.writeFileSync(pathJoin(__dirname, '../package.json'), JSON.stringify(pkgJsonFile, null, 2));  
}

beforeCommit();