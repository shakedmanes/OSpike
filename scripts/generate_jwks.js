const fs = require('fs');
const jose = require('node-jose');
const config = require('./config.js');

async function convertPemToJWKS(pemPath, jwksSavePath) {
  const pemContents = fs.readFileSync(pemPath, 'ascii');
  const jwkContents = (await jose.JWK.asKey(pemContents, "pem")).toJSON(true);  
  jwkContents.alg = config.JWK_ALGORITHM;
  jwkContents.use = config.JWK_USE;    
  fs.writeFileSync(jwksSavePath, JSON.stringify(jwkContents));
}

convertPemToJWKS('src/certs/files/certificate.pem', config.JWKS_PATH);
