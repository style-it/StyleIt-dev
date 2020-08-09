import Core from './StyleIt/index';
import { Modes } from './StyleIt/constants/Modes';
export default class StyleIt {
  //expose only the relevant methods..
  constructor(target, config) {
    //TODO: validate target & config..
    const styleIt = new Core(target, config);
    if (styleIt) {
      this.ExecCmd = styleIt.execCmd;
      this.AddClass = styleIt.addClass;
      this.Save = styleIt.Save;
      this.Load = styleIt.Load;
      this.Destroy = styleIt.Destroy;
      this.Modes = Modes;
      //========================================//
      this.AddClass = this.AddClass.bind(styleIt);
      this.ExecCmd = this.ExecCmd.bind(styleIt);
      this.Save = this.Save.bind(styleIt);
      this.Load = this.Load.bind(styleIt);
      this.Destroy = this.Destroy.bind(styleIt);
    }
  }
}
