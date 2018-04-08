var FollowablePromise = require('../../src/followable-promise');
var expect = require('chai').expect;

describe('FollowablePromise', () => {

  describe('.then()', () => {

    it('should work when resolving', async () => {

      var p = new FollowablePromise( (res, rej) => {

        res('hi');

      });

      expect(await p).to.equal('hi');

    });
    
    it('should work when rejecting', async () => {

      var p = new FollowablePromise( (res, rej) => {

        rej('hi');

      });

      var rejected = false;

      try {
        await p;
      } catch (e) {
        rejected = e;
      }

      expect(rejected).to.equal('hi');

    });

  });

  describe('.follow()', () => {

    it('should call follow function of resolved value', async () => {

      var result = false;

      var p = new FollowablePromise( (res, rej) => {

        res({
          follow: function(rel, vars) {
            result = 'follow:' + rel + ':' + vars;
          }
        });

      });

      expect(await p.follow('A','B'), 'follow:A:B');

    });

    it('should bubble up exceptions from follow', async () => {

      var p = new FollowablePromise( (res, rej) => {

        res({
          follow: function(rel, vars) {
            throw "Hi";
          }
        });

      });

      var result = null;
      try {
        await p.follow('foo');
      } catch (e) {
        result = e;
      }
      expect(result).to.equal('Hi');

    });

  });

});
