import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Footer } from '../../components/site-ui';
import { SupabaseDataService } from '../../services/supabase-data';

interface TutorialMission {
  id: string;
  title: string;
  time: string;
  goal: string;
  outcome: string;
  blocks: string[];
  steps: string[];
}

const TUTORIALS: TutorialMission[] = [
  {
    id: 'build-r3-kit',
    title: 'Build The R3 School STEM Kit',
    time: '14 min',
    goal: 'Assemble the UNO R3 board, motor driver, chassis, wheels, battery pack, and wiring safely.',
    outcome: 'Your physical kit is wired, checked, and ready for C-SLIDE programs.',
    blocks: ['kit_checklist', 'motor_driver', 'power_safety'],
    steps: [
      'Place the UNO R3, motor driver, chassis, wheels, jumper wires, and battery pack on the table.',
      'Mount the motors and wheels, then secure the UNO R3 and motor driver to the chassis.',
      'Wire ENA/IN1/IN2 and ENB/IN3/IN4 to the pins shown in the generated sketch.',
      'Connect motor power last, check polarity, and keep the wheels off the table for the first test.',
      'Optional video tutorial slot: add the build video here when it is ready.',
    ],
  },
  {
    id: 'r3-led-intro',
    title: 'Light Up The R3 Board',
    time: '5 min',
    goal: 'Use C-SLIDE to turn the Arduino UNO R3 built-in LED on, blink it, and confirm upload flow.',
    outcome: 'The board LED blinks from code you generated in C-SLIDE.',
    blocks: ['arduino_led_builtin', 'arduino_blink_led', 'wait_seconds'],
    steps: [
      'Open the IDE and connect the UNO R3 with USB.',
      'Drag the R3 built-in LED block into the workspace and set it on.',
      'Add the blink built-in LED block and copy the generated sketch.',
      'Upload the sketch with Arduino IDE or the local uploader service.',
    ],
  },
  {
    id: 'hello-world',
    title: 'Print With C-SLIDE',
    time: '4 min',
    goal: 'Use text blocks to print a serial message from your first C-SLIDE program.',
    outcome: 'Your program prints a message in the generated Arduino serial sketch.',
    blocks: ['text_print', 'text'],
    steps: [
      'Open the Text blocks.',
      'Drag out a print block.',
      'Connect a text block and type Hello, World!',
      'Run the code and check the console output.',
    ],
  },
  {
    id: 'math-output',
    title: 'Math With Blocks',
    time: '5 min',
    goal: 'Connect number blocks to print an answer.',
    outcome: 'Your C-SLIDE program combines math blocks and prints the result.',
    blocks: ['math_number', 'math_arithmetic', 'text_print'],
    steps: [
      'Add a print block.',
      'Place an arithmetic block inside it.',
      'Put number blocks into both math inputs.',
      'Run the code and compare the result.',
    ],
  },
  {
    id: 'move-truck',
    title: 'Move The Truck',
    time: '6 min',
    goal: 'Drive the virtual truck forward and backward.',
    outcome: 'The virtual truck follows your command path on the track.',
    blocks: ['move_forward', 'move_backward', 'delay_ms'],
    steps: [
      'Go to the IDE page.',
      'Drag a Move Forward block into the workspace.',
      'Add a Wait block, then a Move Backward block.',
      'Press Run in the simulator.',
    ],
  },
  {
    id: 'turns-loops',
    title: 'Turns And Loops',
    time: '7 min',
    goal: 'Use repeat blocks to draw a simple driving pattern.',
    outcome: 'The simulator draws a repeated driving path using turns and loops.',
    blocks: ['turn_left', 'turn_right', 'controls_repeat_ext'],
    steps: [
      'Place a repeat block in the workspace.',
      'Put move and turn blocks inside it.',
      'Set the repeat number to 4.',
      'Run the simulator and watch the path.',
    ],
  },
  {
    id: 'lights',
    title: 'Scratch Light Blocks',
    time: '5 min',
    goal: 'Add colourful light actions to the truck program.',
    outcome: 'Your truck lights change colour during a movement program.',
    blocks: ['light_on', 'set_light_color', 'light_off'],
    steps: [
      'Open the Scratch Light category.',
      'Turn the light on and choose a colour.',
      'Add movement blocks after the light block.',
      'Turn the light off at the end.',
    ],
  },
  {
    id: 'ultrasonic-obstacle',
    title: 'Stop For Obstacles',
    time: '9 min',
    goal: 'Use the R3 kit ultrasonic sensor block to react when something is close.',
    outcome: 'Your generated sketch reads distance and runs safety actions near obstacles.',
    blocks: ['arduino_ultrasonic_read', 'if_obstacle_close', 'arduino_stop_motors'],
    steps: [
      'Wire the ultrasonic trig and echo pins to the kit pins.',
      'Add the read ultrasonic block to print distance.',
      'Place an if obstacle closer than block around a stop motors block.',
      'Upload and test with your hand in front of the sensor.',
    ],
  },
  {
    id: 'line-following',
    title: 'Line Follow Step',
    time: '10 min',
    goal: 'Use the R3 kit line sensor block to make one line-following decision.',
    outcome: 'The car can take a simple left/right/forward line-following step.',
    blocks: ['line_follow_step', 'arduino_set_motor_speed', 'arduino_stop_motors'],
    steps: [
      'Connect the left and right line sensors.',
      'Drag in the line follow step block and set the sensor pins.',
      'Add stop motors after the test step.',
      'Upload and test over black tape on a light surface.',
    ],
  },
];

@Component({
  selector: 'app-ide-tutorials',
  standalone: true,
  imports: [CommonModule, RouterLink, Footer],
  templateUrl: './ide-tutorials.html',
  styleUrls: ['./ide-tutorials.css'],
})
export class IdeTutorials implements OnInit {
  tutorials = TUTORIALS;
  completedIds = new Set<string>();
  activeTutorial = TUTORIALS[0];
  celebrationTutorial: TutorialMission | null = null;
  confettiPieces = Array.from({ length: 42 }, (_, index) => index);
  message = '';
  isError = false;

  constructor(private supabase: SupabaseDataService) {}

  get completedCount(): number {
    return this.completedIds.size;
  }

  async ngOnInit(): Promise<void> {
    const activeId = localStorage.getItem('counterspace-active-tutorial');
    this.activeTutorial = this.tutorials.find((tutorial) => tutorial.id === activeId) ?? this.activeTutorial;

    try {
      const progress = await this.supabase.listTutorialProgress();
      this.completedIds = new Set(
        progress.filter((item) => item.completed).map((item) => item.tutorial_id),
      );
    } catch {
      this.message = 'Log in to save tutorial progress on this device.';
    }
  }

  isComplete(tutorialId: string): boolean {
    return this.completedIds.has(tutorialId);
  }

  startTutorial(tutorial: TutorialMission): void {
    this.activeTutorial = tutorial;
    localStorage.setItem('counterspace-active-tutorial', tutorial.id);
  }

  async markComplete(tutorialId: string): Promise<void> {
    const tutorial = this.tutorials.find((item) => item.id === tutorialId) ?? this.activeTutorial;
    try {
      await this.supabase.markTutorialComplete(tutorialId);
      this.completedIds = new Set([...this.completedIds, tutorialId]);
      this.activeTutorial = tutorial;
      localStorage.setItem('counterspace-active-tutorial', tutorial.id);
      this.celebrationTutorial = tutorial;
      this.message = 'Progress saved.';
      this.isError = false;
    } catch (error) {
      this.completedIds = new Set([...this.completedIds, tutorialId]);
      this.activeTutorial = tutorial;
      this.celebrationTutorial = tutorial;
      localStorage.setItem('counterspace-active-tutorial', tutorial.id);
      this.message =
        error instanceof Error
          ? `${error.message} Achievement shown locally.`
          : 'Achievement shown locally, but cloud progress was not saved.';
      this.isError = true;
    }
  }

  closeCelebration(): void {
    this.celebrationTutorial = null;
  }
}
