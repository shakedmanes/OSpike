const pathJoin = require('path').join;

const config = {

  // Copy paths before compilation
  copyPath: [
    { src: './src/certs/files' ,dest: './dist/certs' },
    { src: './src/views' , dest: './dist' },
  ],

  // OpenSSL and Certificates configurations
  CERTIFICATES_PATH: 'src/certs/files',
  CERTIFICATE_FILE_NAME: 'certificate.pem',
  PRIVATE_KEY_FILE_NAME: 'privatekey.pem',
  PUBLIC_KEY_FILE_NAME: 'publickey.pem',
  get PUBLIC_KEY_PATH() { return pathJoin(this.CERTIFICATES_PATH, 'publickey.pem') },
  get JWKS_PATH() { return pathJoin(this.CERTIFICATES_PATH, 'jwks.json') },
  JWK_ALGORITHM: 'RSA256',
  JWK_USE: 'sig',

  // Scripts names contains credentials and credentials names
  scriptsContainsCredentials: ['generate-env-dev', 'generate-env-test', 'generate-env-prod'],
  credentailsToDelete: { '-mongoUrl': 'MONGO_URL_HERE', '-username': 'DB_USERNAME_HERE', '-password': 'DB_PASSWORD_HERE' },
}

module.exports = config;
