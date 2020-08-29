import Core from './StyleIt/index';
import  MODES  from './StyleIt/constants/Modes.json';

export class StyleIt {
  //expose only the relevant methods..
  constructor(target, config) {
    //TODO: validate target & config..
    const styleIt = new Core(target, config);
    if (styleIt) {  
      this.ExecCmd = styleIt.execCmd;
      this.ToggleClass = styleIt.ToggleClass;
      this.Save = styleIt.Save;
      this.Load = styleIt.Load;
      this.Destroy = styleIt.Destroy;
      this.Modes = MODES;
      //========================================//
      this.ToggleClass = this.ToggleClass.bind(styleIt);
      this.ExecCmd = this.ExecCmd.bind(styleIt);
      this.Save = this.Save.bind(styleIt);
      this.Load = this.Load.bind(styleIt);
      this.Destroy = this.Destroy.bind(styleIt);
    }
  }
}
export const Modes = MODES;
