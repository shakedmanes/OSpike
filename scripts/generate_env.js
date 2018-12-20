const fs = require('fs');

function generateEnvFile(port, nodeEnv) {
  // Creates .env file for configuration
  fs.writeFileSync('.env', `PORT=${port}\r\nNODE_ENV=${nodeEnv}`);
 
}

// Getting command arguments or using predefined values
const env = process.argv.length >= process.argv.indexOf('-env') + 1 ? process.argv[process.argv.indexOf('-env') + 1] : 'dev';
const port = process.argv.length >= process.argv.indexOf('-port') + 1 ? process.argv[process.argv.indexOf('-port') + 1 ]: 1337;

generateEnvFile(port, env);