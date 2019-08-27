const fs = require('fs');
const config = require('./config');

function generateEnvFile(nodeEnv, port, hostname, mongoUrl, dbUsername, dbPassword, hostValidation, apmServiceName, apmServerUrl, apmSecretToken, logsDir, logsFileName) {
  // Creates .env file for configuration
  fs.writeFileSync(
    '.env',
    `NODE_ENV=${nodeEnv}\r\nPORT=${port}\r\nHOSTNAME=${hostname}\r\nMONGO_URL=${mongoUrl}\r\nDB_USERNAME=${dbUsername}\r\nDB_PASSWORD=${dbPassword}\r\nHOST_VALIDATION=${hostValidation}\r\nELASTIC_APM_SERVICE_NAME=${apmServiceName}\r\nELASTIC_APM_SERVER_URL=${apmServerUrl}\r\nELASTIC_APM_SECRET_TOKEN=${apmSecretToken}\r\n\LOG_DIR=${logsDir}\r\nLOG_FILE_NAME=${logsFileName}`,
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
const apmServiceName = process.argv.length >= process.argv.indexOf('-apmServiceName') + 1 ? process.argv[process.argv.indexOf('-apmServiceName') + 1]: '';
const apmServerUrl = process.argv.length >= process.argv.indexOf('-apmServerUrl') + 1 ? process.argv[process.argv.indexOf('-apmServerUrl') + 1]: '';
const apmSecretToken = process.argv.length >= process.argv.indexOf('-apmSecretToken') + 1 ? process.argv[process.argv.indexOf('-apmSecretToken') + 1]: '';
const logsDir = process.argv.length >= process.argv.indexOf('-logsDir') + 1 ? process.argv[process.argv.indexOf('-logsDir') + 1]: config.defaultLogDir;
const logsFileName = process.argv.length >= process.argv.indexOf('-logsFileName') + 1 ? process.argv[process.argv.indexOf('-logsFileName') + 1]: config.defaultLogFileName;

generateEnvFile(env, port, hostname, mongoUrl, username, password, hostValidation, apmServiceName, apmServerUrl, apmSecretToken, logsDir, logsFileName);