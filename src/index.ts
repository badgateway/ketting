import BaseKetting from './ketting';
import Resource from './resource';

class Ketting extends BaseKetting {

  static Resource = Resource;
  static Ketting = BaseKetting;

}

export = Ketting;
