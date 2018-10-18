const pathJoin = require('path').join;

const config = {

  // Copy paths before compilation
  copyPath: [
    { src: './src/certs/files' ,dest: './dist/certs' },
    { src: './src/views' , dest: './dist' },
  ],

  // OpenSSL and Certificates configurations
  CERTIFICATES_PATH: 'src/certs/files',
  OPENSSL_PATH: 'C:\\"Program Files"\\Git\\mingw64\\bin\\openssl.exe',
  get PUBLIC_KEY_PATH() { return pathJoin(this.CERTIFICATES_PATH, 'publickey.pem') },
  get JWKS_PATH() { return pathJoin(this.CERTIFICATES_PATH, 'jwks.json') },
  JWK_ALGORITHM: 'RSA256',
  JWK_USE: 'sig',
}

module.exports = config;
