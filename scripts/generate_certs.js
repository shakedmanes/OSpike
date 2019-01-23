const forge = require('node-forge');
const fs = require('fs');
const pathJoin = require('path').join;
const config = require('./config');

function generateCertificates(target) {

  // Create target directory if not already exists
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  // Generate a key pair
  const keys = forge.pki.rsa.generateKeyPair(2048);
 
  // Create a certification request (CSR)  
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([{
    name: 'commonName',
    value: 'OSpike'
  }, {
    name: 'countryName',
    value: 'US'
  }, {
    shortName: 'ST',
    value: 'Virginia'
  }, {
    name: 'localityName',
    value: 'Blacksburg'
  }, {
    name: 'organizationName',
    value: 'Bla Bla'
  }, {
    shortName: 'OU',
    value: 'alB alB'
  }]);
  
  // Sign certification request
  csr.sign(keys.privateKey); 

  // Create certificate form certification request
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(2210936640000);
  cert.setSubject(csr.subject.attributes);
  cert.setIssuer(csr.subject.attributes);  

  // Sign certificate and set signature with sha512
  cert.sign(keys.privateKey, forge.md.sha512.create());

  // Convert certificate and key pair to PEM-format
  const pemCert = forge.pki.certificateToPem(cert);
  const pemPrivateKey = forge.pki.privateKeyToPem(keys.privateKey);
  const pemPublicKey = forge.pki.publicKeyToPem(keys.publicKey);  

  // Save certificate and key pair
  fs.writeFileSync(pathJoin(target, config.CERTIFICATE_FILE_NAME), pemCert);
  fs.writeFileSync(pathJoin(target, config.PRIVATE_KEY_FILE_NAME), pemPrivateKey);
  fs.writeFileSync(pathJoin(target, config.PUBLIC_KEY_FILE_NAME), pemPublicKey);  
}

generateCertificates(config.CERTIFICATES_PATH);