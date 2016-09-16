'use strict';
/* globals KevoreeKevscript, KevoreeCommons, TinyConf, expect */

TinyConf.set('registry', {
  host: 'kevoree.braindead.fr',
  port: 443,
  ssl: true,
  oauth: {
    client_id: 'kevoree_registryapp',
    client_secret: 'kevoree_registryapp_secret'
  }
});

describe('KevScript tests', function () {
  this.timeout(2500);

  var kevs;
  beforeEach(function () {
    var logger = new KevoreeCommons.KevoreeLogger('KevScript');
    logger.setLevel('debug');
    kevs = new KevoreeKevscript(logger);
  });

  it('should create an instance \'node0: JavascriptNode\'', function (done) {
    var script = 'add node0: JavascriptNode/LATEST/LATEST';

    kevs.parse(script, function (err, model) {
      if (err) {
        done(err);
      } else {
        expect(model).toExist();
        const node = model.findNodesByID('node0');
        expect(node).toExist();
        expect(node.typeDefinition).toExist();
        expect(node.typeDefinition.name).toEqual('JavascriptNode');
        done();
      }
    });
  });

  // TODO
});
