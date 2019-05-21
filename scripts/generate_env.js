const fs = require('fs');

function generateEnvFile(nodeEnv, port, hostname, mongoUrl, dbUsername, dbPassword, hostValidation) {
  // Creates .env file for configuration
  fs.writeFileSync(
    '.env',
    `NODE_ENV=${nodeEnv}\r\nPORT=${port}\r\nHOSTNAME=${hostname}\r\nMONGO_URL=${mongoUrl}\r\nDB_USERNAME=${dbUsername}\r\nDB_PASSWORD=${dbPassword}\r\nHOST_VALIDATION=${hostValidation}`,
  );
 
}

// Getting command arguments or using predefined values
const env = process.argv.length >= process.argv.indexOf('-env') + 1 ? process.argv[process.argv.indexOf('-env') + 1] : 'dev';
const port = process.argv.length >= process.argv.indexOf('-port') + 1 ? process.argv[process.argv.indexOf('-port') + 1 ]: 1337;
const hostname = process.argv.length >= process.argv.indexOf('-hostname') + 1 ? process.argv[process.argv.indexOf('-hostname') + 1]: 'localhost';
const mongoUrl = process.argv.length >= process.argv.indexOf('-mongoUrl') + 1 ? process.argv[process.argv.indexOf('-mongoUrl') + 1]: '';
const username = process.argv.length >= process.argv.indexOf('-username') + 1 ? process.argv[process.argv.indexOf('-username') + 1]: '';
const password = process.argv.length >= process.argv.indexOf('-password') + 1 ? process.argv[process.argv.indexOf('-password') + 1]: '';
const hostValidation = process.argv.length >= process.argv.indexOf('-hostValidation') + 1 ? process.argv[process.argv.indexOf('-hostValidation') + 1]: 0;

generateEnvFile(env, port, hostname, mongoUrl, username, password, hostValidation);