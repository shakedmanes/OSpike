const shell = require('shelljs');
const config = require('./config');

function generateCertificates(target) {  

  // Move to the target folder and create the certificates
  shell.mkdir('-p', target);
  shell.cd(target);
  shell.exec(`${config.OPENSSL_PATH} genrsa -out privatekey.pem 2048`);
  shell.exec(`${config.OPENSSL_PATH} rsa -in privatekey.pem -pubout -out publickey.pem`)
  shell.exec(`${config.OPENSSL_PATH} req -new -key privatekey.pem -out certrequest.csr -days 1024 -nodes -subj "/C=US/ST=New York/L=New York/O=Bla Bla/OU=alB alB/CN=authorization-server"`);
  shell.exec(`${config.OPENSSL_PATH} x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem`);
  shell.rm('certrequest.csr');
}

generateCertificates(config.CERTIFICATES_PATH);