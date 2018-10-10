import { expect } from 'chai';

import FollowablePromise from '../../src/followable-promise';

describe('FollowablePromise', () => {

  describe('.then()', () => {

    it('should work when resolving', async () => {

      const p = new FollowablePromise( (res) => {

        // @ts-ignore: I know what I'm doing
        res('hi');

      });

      expect(await p).to.equal('hi');

    });

    it('should work when rejecting', async () => {

      const p = new FollowablePromise( (res, rej) => {

        rej('hi');

      });

      let rejected = false;

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

      const p = new FollowablePromise( (res) => {

        // @ts-ignore: I know what I'm doing
        res({
          // @ts-ignore: I know what I'm doing
          follow: (rel: string, vars: object) => {
            // @ts-ignore: I know what I'm doing
            return 'follow:' + rel + ':' + vars.B;
          // @ts-ignore: I know what I'm doing
          }
        });

      });

      expect(await p.follow('A', {B: 'C'}), 'follow:A:C');

    });

    it('should bubble up exceptions from follow', async () => {

      const p = new FollowablePromise( (res) => {

        // @ts-ignore: I know what I'm doing
        res({
          follow() {
            throw new Error('Hi');
          }
        });

      });

      let result = null;
      try {
        await p.follow('foo');
      } catch (e) {
        result = e;
      }
      expect(result.message).to.equal('Hi');

    });

  });

});
