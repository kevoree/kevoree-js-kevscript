var nconf = require('nconf');

nconf.use('memory');
console.log(nconf);

nconf.set('registry', {
  host: 'localhost',
  port: 8080,
  ssl: false
});
