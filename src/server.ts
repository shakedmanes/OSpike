import * as https from 'https';
import { join as pathJoin } from 'path';
import { readFileSync } from 'fs';
import app from './app';

// TODO: Change these for your own certificates.  This was generated through the commands:
// openssl genrsa -out privatekey.pem 2048
// openssl req -new -key privatekey.pem -out certrequest.csr
// openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
const options = {
  key  : readFileSync(pathJoin(__dirname, 'certs/privatekey.pem')),
  cert : readFileSync(pathJoin(__dirname, 'certs/certificate.pem')),
};

https.createServer(options, app).listen(app.get('port'), () => {
  console.log(`Authorization Server is running at https://localhost:${app.get('port')}
               in ${app.get('env')} mode`);
  console.log('Press CTRL-C to stop\n');
});
