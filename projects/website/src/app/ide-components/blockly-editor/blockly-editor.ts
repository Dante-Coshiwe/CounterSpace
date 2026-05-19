import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, EventEmitter, OnDestroy, Output } from '@angular/core';
import * as Blockly from 'blockly';
import { defineCustomBlocks } from './custom-blocks';
import { defineCustomGenerators, drainGeneratedCommands, generateArduinoCode } from './custom-generators';
import { IdeProject, ProjectSnapshot } from '../../services/supabase-data';

interface ArduinoBoardConnection {
  id: string;
  name: string;
  port: string;
  status: 'connected' | 'remembered' | 'service-offline';
  source: 'browser' | 'local-service' | 'manual';
  lastSeen: string;
}

export interface MovementCommand {
  type:
    | 'move_forward'
    | 'move_distance_cm'
    | 'move_backward'
    | 'strafe_left'
    | 'strafe_right'
    | 'turn_left'
    | 'turn_right'
    | 'spin'
    | 'set_speed'
    | 'delay'
    | 'light_on'
    | 'light_off'
    | 'set_light_color';
  duration?: number;
  angle?: number;
  speed?: number;
  distance?: number;
  direction?: 'left' | 'right';
  color?: string;
}

declare global {
  interface Navigator {
    serial?: {
      getPorts(): Promise<SerialPortLike[]>;
      requestPort(): Promise<SerialPortLike>;
    };
  }

  interface SerialPortLike {
    getInfo(): {
      usbVendorId?: number;
      usbProductId?: number;
    };
  }
}

@Component({
  selector: 'app-blockly-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blockly-editor.html',
  styleUrls: ['./blockly-editor.css'],
})
export class BlocklyEditor implements AfterViewInit, OnDestroy {
  workspace!: Blockly.WorkspaceSvg;
  generatedCode = '';
  arduinoCode = '';
  movementCommands: MovementCommand[] = [];
  showIntroGuide =
    typeof localStorage === 'undefined'
      ? false
      : !localStorage.getItem('counterspace-blockly-guide-seen');
  boardConnections: ArduinoBoardConnection[] = [];
  boardMessage = 'Scanning for Arduino connections...';

  @Output() commandsGenerated = new EventEmitter<MovementCommand[]>();

  getProjectSnapshot(projectName: string): ProjectSnapshot {
    return {
      name: projectName,
      blocklyXml: this.getXml(),
      generatedCode: this.generatedCode,
      arduinoCode: this.arduinoCode,
      movementCommands: this.movementCommands,
      boardConnections: this.boardConnections,
      simulatorState: {
        targetBoard: 'arduino-uno-r3',
        simulator: 'virtual-truck-track-follow',
      },
      themeMode: document.documentElement.dataset['theme'] ?? 'light',
      tutorialId: localStorage.getItem('counterspace-active-tutorial'),
      ideComponents: {
        editor: 'blockly',
        simulator: 'virtual-truck',
        targetBoard: 'arduino-uno-r3',
        language: 'C-SLIDE',
        toolboxVersion: 4,
        connectedBoards: this.boardConnections,
        blockFamilies: [
          'movement',
          'control',
          'timing',
          'math',
          'text',
          'scratch-like',
          'scratch-light',
          'arduino-uno-r3',
          'sensors',
        ],
      },
    };
  }

  loadProjectSnapshot(project: IdeProject): void {
    this.loadXml(project.blockly_xml);
    this.generatedCode = project.generated_code ?? '';
    this.arduinoCode = project.arduino_code ?? '';
    this.movementCommands = (project.movement_commands as MovementCommand[]) ?? [];
    this.commandsGenerated.emit([...this.movementCommands]);
  }

  getXml(): string {
    const dom = Blockly.Xml.workspaceToDom(this.workspace);
    return Blockly.Xml.domToText(dom);
  }

  loadXml(xml: string): void {
    if (!this.workspace || !xml) return;
    this.workspace.clear();
    const dom = Blockly.utils.xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, this.workspace);
  }

  ngAfterViewInit(): void {
    defineCustomBlocks();
    const generators = defineCustomGenerators();

    const toolboxXml = `
      <xml xmlns="https://developers.google.com/blockly/xml">
        <category name="C-SLIDE Movement" colour="#00a6fb">
          <block type="move_forward"></block>
          <block type="move_distance_cm"></block>
          <block type="move_backward"></block>
          <block type="strafe_left"></block>
          <block type="strafe_right"></block>
          <block type="turn_left"></block>
          <block type="turn_right"></block>
          <block type="spin"></block>
          <block type="set_speed"></block>
        </category>
        <category name="Control" colour="#ff922b">
          <block type="controls_repeat_ext"></block>
          <block type="controls_if"></block>
          <block type="if_obstacle_close"></block>
        </category>
        <category name="Timing" colour="#f59f00">
          <block type="wait_seconds"></block>
          <block type="delay_ms"></block>
        </category>
        <category name="Math" colour="#51cf66">
          <block type="math_number"></block>
          <block type="math_arithmetic"></block>
        </category>
        <category name="Text" colour="#ff6b6b">
          <block type="text_print"></block>
          <block type="text"></block>
        </category>
        <category name="Scratch Like" colour="#cc5de8">
          <block type="say_message"></block>
          <block type="play_tone"></block>
        </category>
        <category name="Lights" colour="#ffd43b">
          <block type="light_on"></block>
          <block type="set_light_color"></block>
          <block type="light_off"></block>
        </category>
        <category name="Arduino UNO R3" colour="#ff3b7f">
          <block type="arduino_led_builtin"></block>
          <block type="arduino_blink_led"></block>
          <block type="arduino_set_motor_speed"></block>
          <block type="arduino_stop_motors"></block>
          <block type="arduino_servo_angle"></block>
        </category>
        <category name="R3 Kit Sensors" colour="#15aabf">
          <block type="arduino_ultrasonic_read"></block>
          <block type="if_obstacle_close"></block>
          <block type="line_follow_step"></block>
        </category>
      </xml>
    `;

    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: Blockly.utils.xml.textToDom(toolboxXml),
      trashcan: true,
      scrollbars: true,
      toolboxPosition: 'start',
      collapse: false,
      comments: true,
      media: 'assets/blockly/media/',
    });

    this.keepCategoryOpen();
    this.refreshBoards();

    this.workspace.addChangeListener(() => {
      this.generateFromWorkspace(generators);
    });
  }

  private keepCategoryOpen(): void {
    const toolbox = this.workspace.getToolbox();
    if (!toolbox) return;
    const flyout = toolbox.getFlyout();
    if (!flyout) return;

    (flyout as any).autoClose = false;
    const categories = (toolbox as Blockly.Toolbox).getToolboxItems();
    if (categories && categories.length > 0) {
      const firstCategory = categories[0];
      if (firstCategory && 'select' in firstCategory) (firstCategory as any).select();
    }
    this.workspace.addChangeListener((event) => {
      if (event.type === Blockly.Events.BLOCK_CREATE) flyout.setVisible(true);
    });
  }

  private generateFromWorkspace(generators: any): void {
    if (!this.workspace) return;
    generators['_reset']?.({} as Blockly.Block);
    const topBlocks = this.workspace.getTopBlocks(true);
    let userCode = '';
    topBlocks.forEach((block) => {
      userCode += this.generateBlockCode(block, generators);
    });
    this.generatedCode = userCode;
    this.arduinoCode = generateArduinoCode(generators);
    this.movementCommands = drainGeneratedCommands(generators);
    this.commandsGenerated.emit([...this.movementCommands]);
  }

  private generateBlockCode(block: Blockly.Block, generators: any): string {
    const gen = generators[block.type];
    if (!gen) return '';

    let code = gen(block);

    const nextBlock = block.getNextBlock();
    if (nextBlock) code += this.generateBlockCode(nextBlock, generators);
    return code;
  }

  async refreshBoards(): Promise<void> {
    const connections: ArduinoBoardConnection[] = [];

    try {
      const response = await fetch('http://localhost:3000/boards');
      if (!response.ok) throw new Error('board service unavailable');
      const list = await response.json();
      const serviceBoards = Array.isArray(list) ? list : list?.boards;
      if (Array.isArray(serviceBoards)) {
        serviceBoards.forEach((board: any, index: number) => {
          connections.push({
            id: String(board.id ?? board.path ?? board.port ?? `service-${index}`),
            name: String(board.name ?? board.friendlyName ?? board.manufacturer ?? 'Arduino-compatible board'),
            port: String(board.path ?? board.port ?? board.serialNumber ?? 'Local uploader'),
            status: 'connected',
            source: 'local-service',
            lastSeen: new Date().toLocaleTimeString(),
          });
        });
      }
    } catch {
      this.boardMessage = 'Local uploader service not detected. Browser USB/serial connections can still be remembered below.';
    }

    try {
      const ports = (await navigator.serial?.getPorts?.()) ?? [];
      ports.forEach((port, index) => {
        const info = port.getInfo();
        connections.push({
          id: `serial-${info.usbVendorId ?? 'vendor'}-${info.usbProductId ?? 'product'}-${index}`,
          name: this.describeSerialBoard(info.usbVendorId, info.usbProductId),
          port: `USB ${info.usbVendorId ?? 'unknown'}:${info.usbProductId ?? 'unknown'}`,
          status: 'remembered',
          source: 'browser',
          lastSeen: new Date().toLocaleTimeString(),
        });
      });
    } catch {
      // The browser can deny serial enumeration; the manual connect action handles permission prompts.
    }

    this.boardConnections = this.dedupeConnections(connections);
    if (this.boardConnections.length > 0) {
      this.boardMessage = `${this.boardConnections.length} board connection${this.boardConnections.length === 1 ? '' : 's'} listed.`;
    } else if (!navigator.serial) {
      this.boardMessage = 'Use Chrome or Edge on localhost, or run the optional uploader service, to list Arduino boards.';
    } else {
      this.boardMessage = 'No boards listed yet. Plug in the UNO R3 and choose Connect board.';
    }
  }

  async connectBoard(): Promise<void> {
    if (!navigator.serial?.requestPort) {
      this.boardMessage = 'Web Serial is not available in this browser. Try Chrome or Edge on localhost.';
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      const info = port.getInfo();
      const connection: ArduinoBoardConnection = {
        id: `serial-${info.usbVendorId ?? 'vendor'}-${info.usbProductId ?? 'product'}-${Date.now()}`,
        name: this.describeSerialBoard(info.usbVendorId, info.usbProductId),
        port: `USB ${info.usbVendorId ?? 'unknown'}:${info.usbProductId ?? 'unknown'}`,
        status: 'remembered',
        source: 'browser',
        lastSeen: new Date().toLocaleTimeString(),
      };
      this.boardConnections = this.dedupeConnections([connection, ...this.boardConnections]);
      localStorage.setItem('counterspace-arduino-boards', JSON.stringify(this.boardConnections));
      this.boardMessage = 'Board permission saved for this browser.';
    } catch {
      this.boardMessage = 'Board connection was cancelled.';
    }
  }

  private describeSerialBoard(vendorId?: number, productId?: number): string {
    if (vendorId === 0x2341) return 'Arduino UNO R3';
    if (vendorId === 0x1a86) return 'UNO R3-compatible CH340 board';
    if (vendorId === 0x2a03) return 'Arduino/Genuino UNO board';
    return productId ? 'Arduino-compatible serial board' : 'Arduino UNO R3 kit board';
  }

  private dedupeConnections(connections: ArduinoBoardConnection[]): ArduinoBoardConnection[] {
    const remembered = this.readRememberedBoards();
    const merged = [...connections, ...remembered];
    const seen = new Set<string>();
    return merged.filter((connection) => {
      const key = `${connection.source}-${connection.port}-${connection.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private readRememberedBoards(): ArduinoBoardConnection[] {
    try {
      const raw = localStorage.getItem('counterspace-arduino-boards');
      return raw ? (JSON.parse(raw) as ArduinoBoardConnection[]) : [];
    } catch {
      return [];
    }
  }

  copyArduinoCode(): void {
    if (!this.arduinoCode) return;
    void navigator.clipboard?.writeText(this.arduinoCode);
  }

  clearWorkspace(): void {
    this.workspace?.clear();
    this.generatedCode = '';
    this.arduinoCode = '';
    this.movementCommands = [];
    this.commandsGenerated.emit([]);
  }

  dismissIntroGuide(): void {
    this.showIntroGuide = false;
    localStorage.setItem('counterspace-blockly-guide-seen', 'true');
  }

  importXml(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then((text) => this.loadXml(text));
    input.value = '';
  }

  exportXml(): void {
    const xml = this.getXml();
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'counterspace-project.xml';
    link.click();
    URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void {
    this.workspace?.dispose();
  }
}
