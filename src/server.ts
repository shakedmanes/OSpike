import app from './app';

app.listen(app.get('port'), () => {
  console.log(`Authorization Server is running at http://localhost:${app.get('port')}
               in ${app.get('env')} mode`);
  console.log('Press CTRL-C to stop\n');
});
