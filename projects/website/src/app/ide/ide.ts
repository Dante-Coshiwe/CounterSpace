import { Component } from '@angular/core';
import { MovementCommand , BlocklyEditor} from '../ide-components/blockly-editor/blockly-editor';
import { SimulationView } from '../ide-components/simulation-view/simulation-view';
import {Toolbar} from '../components/site-ui';

@Component({
  selector: 'app-ide-page',
  imports: [BlocklyEditor, SimulationView, Toolbar],
  templateUrl: './ide.html',
  styleUrls: ['./ide.css']
})
export class Ide {
  movementCommands: MovementCommand[] = [];

  // Receive commands from Blockly editor
  onCommandsGenerated(commands: MovementCommand[]) {
    this.movementCommands = commands;
  }
}
