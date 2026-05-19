import * as Blockly from 'blockly/core';
import 'blockly/blocks';

const BLOCK_COLOURS = {
  movement: '#00a6fb',
  motionAlt: '#00d1b2',
  turns: '#845ef7',
  control: '#ff922b',
  timing: '#f59f00',
  math: '#51cf66',
  text: '#ff6b6b',
  sound: '#cc5de8',
  light: '#ffd43b',
  arduino: '#ff3b7f',
  sensor: '#15aabf',
};

export function defineCustomBlocks(): void {
  if (!Blockly.Blocks) {
    throw new Error('Blockly.Blocks is undefined. Did you import blockly/blocks?');
  }

  Blockly.Blocks['move_forward'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('move forward')
        .appendField(new Blockly.FieldNumber(1, 0.1, 10, 0.1), 'DURATION')
        .appendField('sec');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.movement);
      this.setTooltip('Move the car forward for a number of seconds.');
    },
  };

  Blockly.Blocks['move_backward'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('move backward')
        .appendField(new Blockly.FieldNumber(1, 0.1, 10, 0.1), 'DURATION')
        .appendField('sec');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.movement);
      this.setTooltip('Move the car backward for a number of seconds.');
    },
  };

  Blockly.Blocks['move_distance_cm'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('drive')
        .appendField(new Blockly.FieldNumber(25, 1, 500, 1), 'DISTANCE_CM')
        .appendField('cm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.movement);
      this.setTooltip('Drive the truck a measured distance in centimeters.');
    },
  };

  Blockly.Blocks['strafe_left'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('slide left')
        .appendField(new Blockly.FieldNumber(1, 0.1, 10, 0.1), 'DURATION')
        .appendField('sec');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.motionAlt);
      this.setTooltip('Move sideways to the left without turning.');
    },
  };

  Blockly.Blocks['strafe_right'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('slide right')
        .appendField(new Blockly.FieldNumber(1, 0.1, 10, 0.1), 'DURATION')
        .appendField('sec');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.motionAlt);
      this.setTooltip('Move sideways to the right without turning.');
    },
  };

  Blockly.Blocks['turn_left'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('turn left')
        .appendField(new Blockly.FieldNumber(90, 0, 360, 15), 'ANGLE')
        .appendField('deg');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.turns);
      this.setTooltip('Turn left by degrees.');
    },
  };

  Blockly.Blocks['turn_right'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('turn right')
        .appendField(new Blockly.FieldNumber(90, 0, 360, 15), 'ANGLE')
        .appendField('deg');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.turns);
      this.setTooltip('Turn right by degrees.');
    },
  };

  Blockly.Blocks['spin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('spin')
        .appendField(
          new Blockly.FieldDropdown([
            ['clockwise', 'right'],
            ['counter-clockwise', 'left'],
          ]),
          'DIRECTION',
        )
        .appendField(new Blockly.FieldNumber(360, 15, 1080, 15), 'ANGLE')
        .appendField('deg');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.turns);
      this.setTooltip('Spin in place.');
    },
  };

  Blockly.Blocks['set_speed'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('set speed')
        .appendField(new Blockly.FieldNumber(60, 10, 180, 5), 'SPEED')
        .appendField('px/sec');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.movement);
      this.setTooltip('Change simulator speed.');
    },
  };

  Blockly.Blocks['delay_ms'] = {
    init: function () {
      this.appendValueInput('DELAY').setCheck('Number').appendField('wait ms');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.timing);
      this.setTooltip('Pause for the given milliseconds.');
    },
  };

  Blockly.Blocks['wait_seconds'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('wait')
        .appendField(new Blockly.FieldNumber(1, 0.1, 30, 0.1), 'SECONDS')
        .appendField('sec');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.timing);
      this.setTooltip('Pause the program for a number of seconds.');
    },
  };

  Blockly.Blocks['light_on'] = {
    init: function () {
      this.appendDummyInput().appendField('light on');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.light);
      this.setTooltip('Switch light on.');
    },
  };

  Blockly.Blocks['light_off'] = {
    init: function () {
      this.appendDummyInput().appendField('light off');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.light);
      this.setTooltip('Switch light off.');
    },
  };

  Blockly.Blocks['set_light_color'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('set light colour')
        .appendField(
          new Blockly.FieldDropdown([
            ['sunny yellow', '#ffd166'],
            ['rocket red', '#ef476f'],
            ['mint green', '#06d6a0'],
            ['sky blue', '#5dd6ff'],
            ['deep purple', '#7c3aed'],
          ]),
          'COLOR',
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.light);
      this.setTooltip('Choose light color.');
    },
  };

  Blockly.Blocks['say_message'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('say')
        .appendField(new Blockly.FieldTextInput('Let us build!'), 'MESSAGE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.text);
      this.setTooltip('Scratch-like speech bubble message.');
    },
  };

  Blockly.Blocks['play_tone'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('play tone')
        .appendField(new Blockly.FieldNumber(440, 120, 2000, 10), 'FREQ')
        .appendField('Hz for')
        .appendField(new Blockly.FieldNumber(300, 50, 5000, 50), 'DURATION_MS')
        .appendField('ms');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.sound);
      this.setTooltip('Scratch-like sound block.');
    },
  };

  Blockly.Blocks['arduino_led_builtin'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('R3 built-in LED')
        .appendField(
          new Blockly.FieldDropdown([
            ['on', 'HIGH'],
            ['off', 'LOW'],
          ]),
          'STATE',
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.arduino);
      this.setTooltip('Switch the Arduino UNO R3 built-in LED on or off.');
    },
  };

  Blockly.Blocks['arduino_blink_led'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('blink built-in LED')
        .appendField(new Blockly.FieldNumber(3, 1, 30, 1), 'TIMES')
        .appendField('times every')
        .appendField(new Blockly.FieldNumber(300, 50, 5000, 50), 'DURATION_MS')
        .appendField('ms');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.arduino);
      this.setTooltip('Blink the Arduino UNO R3 built-in LED.');
    },
  };

  Blockly.Blocks['arduino_set_motor_speed'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Arduino UNO set motors')
        .appendField('left')
        .appendField(new Blockly.FieldNumber(150, -255, 255, 5), 'LEFT_SPEED')
        .appendField('right')
        .appendField(new Blockly.FieldNumber(150, -255, 255, 5), 'RIGHT_SPEED');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.arduino);
      this.setTooltip('Set left and right motor PWM speed for Arduino car.');
    },
  };

  Blockly.Blocks['arduino_stop_motors'] = {
    init: function () {
      this.appendDummyInput().appendField('Arduino UNO stop motors');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.arduino);
      this.setTooltip('Stop both motors.');
    },
  };

  Blockly.Blocks['arduino_servo_angle'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('servo pin')
        .appendField(new Blockly.FieldNumber(9, 2, 13, 1), 'PIN')
        .appendField('angle')
        .appendField(new Blockly.FieldNumber(90, 0, 180, 1), 'ANGLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.arduino);
      this.setTooltip('Move a servo connected to an Arduino pin.');
    },
  };

  Blockly.Blocks['arduino_ultrasonic_read'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('read ultrasonic trig')
        .appendField(new Blockly.FieldNumber(12, 2, 13, 1), 'TRIG_PIN')
        .appendField('echo')
        .appendField(new Blockly.FieldNumber(13, 2, 13, 1), 'ECHO_PIN');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.sensor);
      this.setTooltip('Read and print distance from an HC-SR04 ultrasonic sensor.');
    },
  };

  Blockly.Blocks['if_obstacle_close'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('if obstacle closer than')
        .appendField(new Blockly.FieldNumber(15, 2, 200, 1), 'DISTANCE_CM')
        .appendField('cm');
      this.appendStatementInput('DO').appendField('do');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.sensor);
      this.setTooltip('Run blocks when the ultrasonic sensor sees an obstacle nearby.');
    },
  };

  Blockly.Blocks['line_follow_step'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('line follow step left sensor')
        .appendField(new Blockly.FieldNumber(2, 2, 13, 1), 'LEFT_PIN')
        .appendField('right sensor')
        .appendField(new Blockly.FieldNumber(4, 2, 13, 1), 'RIGHT_PIN');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(BLOCK_COLOURS.sensor);
      this.setTooltip('One simple line-following decision for two digital sensors.');
    },
  };
}
