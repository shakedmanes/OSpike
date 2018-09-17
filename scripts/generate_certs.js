const shell = require('shelljs');

function generateCertificates(target) {  

  // Move to the target folder and create the certificates
  shell.mkdir('-p', target);
  shell.cd(target);
  shell.exec(`C:\\"Program Files"\\Git\\mingw64\\bin\\openssl.exe genrsa -out privatekey.pem 2048`);
  shell.exec(`C:\\"Program Files"\\Git\\mingw64\\bin\\openssl.exe req -new -key privatekey.pem -out certrequest.csr -days 1024 -nodes -subj "/C=US/ST=New York/L=New York/O=Bla Bla/OU=alB alB/CN=authorization-server"`);
  shell.exec(`C:\\"Program Files"\\Git\\mingw64\\bin\\openssl.exe x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem`);
  shell.rm('certrequest.csr');
}

generateCertificates('src/certs');