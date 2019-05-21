/** 
 * After commit script, use after commit to import project credentials
 * for all the environments which used before the commit.
 */
const fs = require('fs');
const pathJoin = require('path').join;
const config = require('./config');
const pkgJsonFile = require('../package.json');

function afterCommit() {
  const envsConfigurations = JSON.parse(fs.readFileSync(pathJoin(__dirname, '../', config.afterCommitFile)));

  for (scriptName of config.scriptsContainsCredentials) {
    const unmodifiedScriptValue = pkgJsonFile.scripts[scriptName].split(' ');

    for (deleteCred of Object.keys(config.credentailsToDelete)) {
      const index = unmodifiedScriptValue.indexOf(deleteCred) + 1;
      unmodifiedScriptValue[index] = envsConfigurations[scriptName][deleteCred]
    }

    pkgJsonFile.scripts[scriptName] = unmodifiedScriptValue.join(' ');
  }

  fs.writeFileSync(pathJoin(__dirname, '../package.json'), JSON.stringify(pkgJsonFile, null, 2));
  fs.unlinkSync(pathJoin(__dirname, '../', config.afterCommitFile));
}

afterCommit();