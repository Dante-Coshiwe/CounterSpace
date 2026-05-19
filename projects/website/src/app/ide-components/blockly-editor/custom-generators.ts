import * as Blockly from 'blockly';
import type { MovementCommand } from './blockly-editor';

type GeneratorMap = Record<string, (block: Blockly.Block) => string>;

export function defineCustomGenerators(): GeneratorMap {
  const queue: MovementCommand[] = [];
  const arduinoLines: string[] = [];
  const generators: GeneratorMap = {};

  const push = (command: MovementCommand): void => {
    queue.push(command);
  };
  const durationMs = (block: Blockly.Block): number =>
    Math.max(Number(block.getFieldValue('DURATION')) || 1, 0.1) * 1000;

  generators['move_forward'] = (block) => {
    const duration = durationMs(block);
    push({ type: 'move_forward', duration });
    arduinoLines.push(`driveForward(${Math.round(duration)});`);
    return `move forward ${duration / 1000}s\n`;
  };
  generators['move_distance_cm'] = (block) => {
    const distance = Math.max(Number(block.getFieldValue('DISTANCE_CM')) || 25, 1);
    const duration = (distance / 10) * 1000;
    push({ type: 'move_distance_cm', distance, duration });
    arduinoLines.push(`driveCentimeters(${Math.round(distance)});`);
    return `drive ${distance}cm\n`;
  };
  generators['move_backward'] = (block) => {
    const duration = durationMs(block);
    push({ type: 'move_backward', duration });
    arduinoLines.push(`driveBackward(${Math.round(duration)});`);
    return `move backward ${duration / 1000}s\n`;
  };
  generators['strafe_left'] = (block) => {
    const duration = durationMs(block);
    push({ type: 'strafe_left', duration });
    arduinoLines.push(`pivotLeft(${Math.round(duration)});`);
    return `slide left ${duration / 1000}s\n`;
  };
  generators['strafe_right'] = (block) => {
    const duration = durationMs(block);
    push({ type: 'strafe_right', duration });
    arduinoLines.push(`pivotRight(${Math.round(duration)});`);
    return `slide right ${duration / 1000}s\n`;
  };
  generators['turn_left'] = (block) => {
    const angle = Number(block.getFieldValue('ANGLE')) || 90;
    push({ type: 'turn_left', angle, duration: 520 });
    arduinoLines.push(`turnLeft(${Math.max(150, Math.round((angle / 90) * 520))});`);
    return `turn left ${angle}deg\n`;
  };
  generators['turn_right'] = (block) => {
    const angle = Number(block.getFieldValue('ANGLE')) || 90;
    push({ type: 'turn_right', angle, duration: 520 });
    arduinoLines.push(`turnRight(${Math.max(150, Math.round((angle / 90) * 520))});`);
    return `turn right ${angle}deg\n`;
  };
  generators['spin'] = (block) => {
    const angle = Number(block.getFieldValue('ANGLE')) || 360;
    const direction = block.getFieldValue('DIRECTION') === 'left' ? 'left' : 'right';
    push({ type: 'spin', angle, direction, duration: 900 });
    arduinoLines.push(
      `${direction === 'left' ? 'turnLeft' : 'turnRight'}(${Math.max(150, Math.round((angle / 360) * 900))});`,
    );
    return `spin ${direction} ${angle}deg\n`;
  };
  generators['set_speed'] = (block) => {
    const speed = Number(block.getFieldValue('SPEED')) || 60;
    push({ type: 'set_speed', speed });
    const pwm = Math.min(Math.max(Math.round((speed / 180) * 255), 60), 255);
    arduinoLines.push(`setMotorSpeed(${pwm}, ${pwm});`);
    return `set speed ${speed}px/sec\n`;
  };
  generators['delay_ms'] = (block) => {
    const delayBlock = block.getInputTargetBlock('DELAY');
    const delayText = delayBlock ? generateValue(delayBlock, generators) : '1000';
    const delay = Number(evalMath(delayText)) || 1000;
    push({ type: 'delay', duration: delay });
    arduinoLines.push(`delay(${Math.round(delay)});`);
    return `wait ${delay}ms\n`;
  };
  generators['wait_seconds'] = (block) => {
    const seconds = Math.max(Number(block.getFieldValue('SECONDS')) || 1, 0.1);
    const delay = seconds * 1000;
    push({ type: 'delay', duration: delay });
    arduinoLines.push(`delay(${Math.round(delay)});`);
    return `wait ${seconds}s\n`;
  };
  generators['light_on'] = () => {
    push({ type: 'light_on' });
    arduinoLines.push('setHeadlight(true);');
    return 'light on\n';
  };
  generators['light_off'] = () => {
    push({ type: 'light_off' });
    arduinoLines.push('setHeadlight(false);');
    return 'light off\n';
  };
  generators['set_light_color'] = (block) => {
    const color = String(block.getFieldValue('COLOR') || '#ffd166');
    push({ type: 'set_light_color', color });
    arduinoLines.push(`// selected light color ${color}`);
    arduinoLines.push('setHeadlight(true);');
    return `set light colour ${color}\n`;
  };
  generators['say_message'] = (block) => {
    const text = String(block.getFieldValue('MESSAGE') ?? '').replace(/"/g, '\\"');
    arduinoLines.push(`Serial.println("${text}");`);
    return `say "${text}"\n`;
  };
  generators['play_tone'] = (block) => {
    const frequency = Math.round(Number(block.getFieldValue('FREQ')) || 440);
    const duration = Math.round(Number(block.getFieldValue('DURATION_MS')) || 300);
    arduinoLines.push(`tone(BUZZER_PIN, ${frequency}, ${duration});`);
    arduinoLines.push(`delay(${duration});`);
    return `play tone ${frequency}Hz ${duration}ms\n`;
  };
  generators['arduino_led_builtin'] = (block) => {
    const state = block.getFieldValue('STATE') === 'HIGH' ? 'HIGH' : 'LOW';
    arduinoLines.push(`digitalWrite(LED_BUILTIN, ${state});`);
    return `R3 built-in LED ${state === 'HIGH' ? 'on' : 'off'}\n`;
  };
  generators['arduino_blink_led'] = (block) => {
    const times = Math.max(Math.round(Number(block.getFieldValue('TIMES')) || 3), 1);
    const duration = Math.max(Math.round(Number(block.getFieldValue('DURATION_MS')) || 300), 50);
    arduinoLines.push(`blinkBuiltInLed(${times}, ${duration});`);
    return `blink built-in LED ${times} times\n`;
  };
  generators['arduino_set_motor_speed'] = (block) => {
    const left = Math.min(Math.max(Number(block.getFieldValue('LEFT_SPEED')) || 0, -255), 255);
    const right = Math.min(Math.max(Number(block.getFieldValue('RIGHT_SPEED')) || 0, -255), 255);
    arduinoLines.push(`setMotorSpeed(${Math.round(left)}, ${Math.round(right)});`);
    return `arduino set motors left ${Math.round(left)} right ${Math.round(right)}\n`;
  };
  generators['arduino_stop_motors'] = () => {
    arduinoLines.push('stopMotors();');
    return `arduino stop motors\n`;
  };
  generators['arduino_servo_angle'] = (block) => {
    const pin = Math.round(Number(block.getFieldValue('PIN')) || 9);
    const angle = Math.min(Math.max(Math.round(Number(block.getFieldValue('ANGLE')) || 90), 0), 180);
    arduinoLines.push(`moveServo(${pin}, ${angle});`);
    return `servo pin ${pin} angle ${angle}\n`;
  };
  generators['arduino_ultrasonic_read'] = (block) => {
    const trig = Math.round(Number(block.getFieldValue('TRIG_PIN')) || 12);
    const echo = Math.round(Number(block.getFieldValue('ECHO_PIN')) || 13);
    arduinoLines.push(`Serial.println(readDistanceCm(${trig}, ${echo}));`);
    return `read ultrasonic trig ${trig} echo ${echo}\n`;
  };
  generators['if_obstacle_close'] = (block) => {
    const distance = Math.max(Math.round(Number(block.getFieldValue('DISTANCE_CM')) || 15), 2);
    const aStart = arduinoLines.length;
    let branch = '';
    let current = block.getInputTargetBlock('DO');
    while (current) {
      branch += generateStatement(current, generators);
      current = current.getNextBlock();
    }
    const addedA = arduinoLines.slice(aStart);
    arduinoLines.splice(aStart, addedA.length);
    arduinoLines.push(`if (readDistanceCm(12, 13) < ${distance}) {`);
    addedA.forEach((line) => arduinoLines.push(`  ${line}`));
    arduinoLines.push('}');
    return `if obstacle closer than ${distance}cm {\n${branch}}\n`;
  };
  generators['line_follow_step'] = (block) => {
    const leftPin = Math.round(Number(block.getFieldValue('LEFT_PIN')) || 2);
    const rightPin = Math.round(Number(block.getFieldValue('RIGHT_PIN')) || 4);
    arduinoLines.push(`lineFollowStep(${leftPin}, ${rightPin});`);
    return `line follow step left ${leftPin} right ${rightPin}\n`;
  };
  generators['controls_repeat_ext'] = (block) => {
    const timesBlock = block.getInputTargetBlock('TIMES');
    const repeatText = timesBlock ? generateValue(timesBlock, generators) : '10';
    const repeatCount = Math.max(Number(evalMath(repeatText)) || 0, 0);
    const qStart = queue.length;
    const aStart = arduinoLines.length;

    let branch = '';
    let current = block.getInputTargetBlock('DO');
    while (current) {
      branch += generateStatement(current, generators);
      current = current.getNextBlock();
    }

    const addedQ = queue.slice(qStart);
    const addedA = arduinoLines.slice(aStart);
    queue.splice(qStart, addedQ.length);
    arduinoLines.splice(aStart, addedA.length);
    for (let i = 0; i < repeatCount; i++) {
      addedQ.forEach((command) => queue.push({ ...command }));
      addedA.forEach((line) => arduinoLines.push(line));
    }

    return `repeat ${repeatText} times {\n${branch}}\n`;
  };

  generators['math_number'] = (block) => String(block.getFieldValue('NUM') ?? '0');
  generators['math_arithmetic'] = (block) => {
    const operators: Record<string, string> = {
      ADD: '+',
      MINUS: '-',
      MULTIPLY: '*',
      DIVIDE: '/',
      POWER: '**',
    };
    const op = operators[block.getFieldValue('OP')] ?? '+';
    const a = block.getInputTargetBlock('A');
    const b = block.getInputTargetBlock('B');
    return `(${a ? generateValue(a, generators) : '0'} ${op} ${b ? generateValue(b, generators) : '0'})`;
  };
  generators['text'] = (block) => `"${String(block.getFieldValue('TEXT') ?? '').replace(/"/g, '\\"')}"`;
  generators['text_print'] = (block) => {
    const textBlock = block.getInputTargetBlock('TEXT');
    const text = textBlock ? generateValue(textBlock, generators) : '""';
    arduinoLines.push(`Serial.println(${text});`);
    return `print ${text}\n`;
  };

  generators['_reset'] = () => {
    queue.splice(0, queue.length);
    arduinoLines.splice(0, arduinoLines.length);
    return '';
  };
  generators['_drainQueue'] = () => JSON.stringify(queue.splice(0, queue.length));
  generators['_buildArduinoCode'] = () => buildArduinoSketch(arduinoLines);
  return generators;
}

export function drainGeneratedCommands(generators: GeneratorMap): MovementCommand[] {
  const raw = generators['_drainQueue']?.({} as Blockly.Block) ?? '[]';
  return JSON.parse(raw) as MovementCommand[];
}

export function generateArduinoCode(generators: GeneratorMap): string {
  return generators['_buildArduinoCode']?.({} as Blockly.Block) ?? '';
}

function generateStatement(block: Blockly.Block, generators: GeneratorMap): string {
  const generator = generators[block.type];
  return generator ? generator(block) : '';
}

function generateValue(block: Blockly.Block, generators: GeneratorMap): string {
  const generator = generators[block.type];
  return generator ? generator(block) : '0';
}

function evalMath(expression: string): number {
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) return Number(expression);
  return Function(`"use strict"; return (${expression});`)() as number;
}

function buildArduinoSketch(lines: string[]): string {
  const body = lines.length ? lines : ['stopMotors();'];
  return `// C-SLIDE (Counter Space Learning IDE) -> Arduino UNO R3
#include <Servo.h>

#define ENA 5
#define IN1 6
#define IN2 7
#define ENB 9
#define IN3 10
#define IN4 11
#define HEADLIGHT 3
#define BUZZER_PIN 8

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(HEADLIGHT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  ${body.join('\n  ')}
  stopMotors();
  delay(300);
}

void setMotorSpeed(int leftSpeed, int rightSpeed) {
  bool leftForward = leftSpeed >= 0;
  bool rightForward = rightSpeed >= 0;
  int leftPwm = constrain(abs(leftSpeed), 0, 255);
  int rightPwm = constrain(abs(rightSpeed), 0, 255);
  digitalWrite(IN1, leftForward ? HIGH : LOW);
  digitalWrite(IN2, leftForward ? LOW : HIGH);
  digitalWrite(IN3, rightForward ? HIGH : LOW);
  digitalWrite(IN4, rightForward ? LOW : HIGH);
  analogWrite(ENA, leftPwm);
  analogWrite(ENB, rightPwm);
}

void stopMotors() {
  analogWrite(ENA, 0);
  analogWrite(ENB, 0);
}

void setHeadlight(bool on) {
  digitalWrite(HEADLIGHT, on ? HIGH : LOW);
}

void driveForward(int ms) {
  setMotorSpeed(180, 180);
  delay(ms);
}

void driveBackward(int ms) {
  setMotorSpeed(-180, -180);
  delay(ms);
}

void pivotLeft(int ms) {
  setMotorSpeed(-170, 170);
  delay(ms);
}

void pivotRight(int ms) {
  setMotorSpeed(170, -170);
  delay(ms);
}

void turnLeft(int ms) {
  pivotLeft(ms);
}

void turnRight(int ms) {
  pivotRight(ms);
}

void driveCentimeters(int cm) {
  int ms = max(120, cm * 95);
  driveForward(ms);
}

void blinkBuiltInLed(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(durationMs);
    digitalWrite(LED_BUILTIN, LOW);
    delay(durationMs);
  }
}

void moveServo(int pin, int angle) {
  Servo servo;
  servo.attach(pin);
  servo.write(constrain(angle, 0, 180));
  delay(450);
  servo.detach();
}

long readDistanceCm(int trigPin, int echoPin) {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return 999;
  return duration / 58;
}

void lineFollowStep(int leftPin, int rightPin) {
  pinMode(leftPin, INPUT);
  pinMode(rightPin, INPUT);
  int left = digitalRead(leftPin);
  int right = digitalRead(rightPin);
  if (left == LOW && right == LOW) driveForward(120);
  else if (left == LOW) pivotLeft(90);
  else if (right == LOW) pivotRight(90);
  else stopMotors();
}`;
}
