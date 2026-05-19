import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MovementCommand } from '../blockly-editor/blockly-editor';

interface TruckState {
  x: number;
  y: number;
  angle: number;
}

@Component({
  selector: 'app-simulation-view',
  standalone: true,
  templateUrl: './simulation-view.html',
  styleUrls: ['./simulation-view.css'],
})
export class SimulationView implements AfterViewInit, OnDestroy {
  @Input() movementQueue: MovementCommand[] = [];
  @ViewChild('robotCanvas') robotCanvas!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private truck: TruckState = { x: 450, y: 250, angle: 0 };
  private trailPoints: { x: number; y: number }[] = [];
  private runQueue: MovementCommand[] = [];
  private currentMove: MovementCommand | null = null;
  private animationId: number | null = null;
  private moveStartTime = 0;
  private moveStartX = 0;
  private moveStartY = 0;
  private moveStartAngle = 0;
  private moveSpeed = 50;
  private lightOn = false;
  private lightColor = '#ffd166';
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.robotCanvas.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;
    this.ctx = context;
    this.resizeCanvas();
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(canvas);
    this.render();
    this.animate();
  }

  startSimulation(): void {
    if (!this.movementQueue.length) {
      alert('Add some blocks before running the simulator.');
      return;
    }

    this.resetSimulation();
    this.runQueue = this.movementQueue.map((command) => ({ ...command }));
    this.nextMove();
  }

  stopSimulation(): void {
    this.runQueue = [];
    this.currentMove = null;
  }

  resetSimulation(): void {
    this.stopSimulation();
    this.truck = { x: 450, y: 250, angle: 0 };
    this.trailPoints = [];
    this.moveSpeed = 50;
    this.lightOn = false;
    this.lightColor = '#ffd166';
    this.render();
  }

  private animate = (): void => {
    this.update();
    this.render();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private update(): void {
    if (!this.currentMove) return;

    if (this.currentMove.type === 'set_speed') {
      this.moveSpeed = this.currentMove.speed ?? this.moveSpeed;
      this.nextMove();
      return;
    }

    if (this.currentMove.type === 'light_on') {
      this.lightOn = true;
      this.nextMove();
      return;
    }

    if (this.currentMove.type === 'light_off') {
      this.lightOn = false;
      this.nextMove();
      return;
    }

    if (this.currentMove.type === 'set_light_color') {
      this.lightColor = this.currentMove.color ?? this.lightColor;
      this.lightOn = true;
      this.nextMove();
      return;
    }

    const elapsed = performance.now() - this.moveStartTime;
    const duration = this.currentMove.duration ?? 1;
    const progress = Math.min(elapsed / duration, 1);

    if (
      this.currentMove.type === 'move_forward' ||
      this.currentMove.type === 'move_distance_cm' ||
      this.currentMove.type === 'move_backward' ||
      this.currentMove.type === 'strafe_left' ||
      this.currentMove.type === 'strafe_right'
    ) {
      this.updatePosition(progress, duration);
    } else if (
      this.currentMove.type === 'turn_left' ||
      this.currentMove.type === 'turn_right' ||
      this.currentMove.type === 'spin'
    ) {
      this.updateAngle(progress);
    }

    if (this.currentMove.type !== 'delay') {
      this.trailPoints.push({ x: this.truck.x, y: this.truck.y });
    }

    if (progress >= 1) this.nextMove();
  }

  private updatePosition(progress: number, duration: number): void {
    if (!this.currentMove) return;

    const seconds = duration / 1000;
    const distance =
      this.currentMove.type === 'move_distance_cm'
        ? (this.currentMove.distance ?? 25) * 4
        : seconds * this.moveSpeed;
    let angle = this.moveStartAngle;
    let direction = 1;

    if (this.currentMove.type === 'move_backward') direction = -1;
    if (this.currentMove.type === 'strafe_left') angle -= Math.PI / 2;
    if (this.currentMove.type === 'strafe_right') angle += Math.PI / 2;

    const targetX = this.moveStartX + Math.cos(angle) * distance * direction;
    const targetY = this.moveStartY + Math.sin(angle) * distance * direction;

    this.truck.x = this.moveStartX + (targetX - this.moveStartX) * progress;
    this.truck.y = this.moveStartY + (targetY - this.moveStartY) * progress;
  }

  private updateAngle(progress: number): void {
    if (!this.currentMove) return;

    const direction =
      this.currentMove.type === 'turn_left' ||
      (this.currentMove.type === 'spin' && this.currentMove.direction === 'left')
        ? -1
        : 1;
    const targetAngle =
      this.moveStartAngle + direction * (((this.currentMove.angle ?? 90) * Math.PI) / 180);
    this.truck.angle = this.moveStartAngle + (targetAngle - this.moveStartAngle) * progress;
  }

  private nextMove(): void {
    this.currentMove = this.runQueue.shift() ?? null;
    this.moveStartTime = performance.now();
    this.moveStartX = this.truck.x;
    this.moveStartY = this.truck.y;
    this.moveStartAngle = this.truck.angle;
  }

  private render(): void {
    if (!this.ctx) return;
    const canvas = this.robotCanvas.nativeElement;

    this.ctx.fillStyle = '#f5f7fb';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.ctx.save();
    this.ctx.translate(canvas.width / 2 - this.truck.x, canvas.height / 2 - this.truck.y);
    this.drawGrid(canvas);
    this.drawTrail();
    this.drawTruck();
    this.ctx.restore();
    this.drawHud(canvas);
  }

  private drawGrid(canvas: HTMLCanvasElement): void {
    const cameraX = this.truck.x - canvas.width / 2;
    const cameraY = this.truck.y - canvas.height / 2;
    const startX = Math.floor(cameraX / 50) * 50 - 50;
    const endX = cameraX + canvas.width + 50;
    const startY = Math.floor(cameraY / 50) * 50 - 50;
    const endY = cameraY + canvas.height + 50;

    this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.1)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x < endX; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }

    for (let y = startY; y < endY; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = 'rgba(0, 166, 251, 0.18)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-260, -160, 520, 320);
  }

  private drawTrail(): void {
    if (this.trailPoints.length < 2) return;

    this.ctx.strokeStyle = '#ff3b7f';
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
    for (let i = 1; i < this.trailPoints.length; i++) {
      this.ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
    }
    this.ctx.stroke();
  }

  private drawTruck(): void {
    const { x, y, angle } = this.truck;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    if (this.lightOn) {
      this.ctx.fillStyle = this.lightColor;
      this.ctx.globalAlpha = 0.34;
      this.ctx.beginPath();
      this.ctx.moveTo(40, -10);
      this.ctx.lineTo(128, -42);
      this.ctx.lineTo(128, 42);
      this.ctx.lineTo(40, 10);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }

    this.roundRect(-58, -19, 78, 38, 7, '#00a6fb');
    this.roundRect(-54, -15, 48, 30, 5, '#0077b6');
    this.roundRect(12, -23, 42, 46, 7, '#06d6a0');
    this.roundRect(24, -16, 18, 13, 3, '#edf6ff');
    this.roundRect(24, 3, 18, 13, 3, '#dbeafe');
    this.roundRect(-47, -10, 32, 20, 3, 'rgba(255, 255, 255, 0.16)');
    this.ctx.fillStyle = this.lightOn ? this.lightColor : '#9aa8b8';
    this.ctx.fillRect(52, -9, 7, 7);
    this.ctx.fillRect(52, 2, 7, 7);

    this.ctx.fillStyle = '#ff922b';
    this.ctx.fillRect(-61, -11, 5, 7);
    this.ctx.fillRect(-61, 4, 5, 7);

    this.ctx.fillStyle = '#14213d';
    [-42, -14, 28, 48].forEach((wheelX) => {
      this.ctx.beginPath();
      this.ctx.ellipse(wheelX, 22, 8, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.ellipse(wheelX, -22, 8, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  private drawHud(canvas: HTMLCanvasElement): void {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    this.roundRect(14, 14, 190, 52, 8, 'rgba(15, 23, 42, 0.72)');
    this.ctx.fillStyle = '#e0f2fe';
    this.ctx.font = '700 13px system-ui, sans-serif';
    this.ctx.fillText('Track follows truck', 28, 36);
    this.ctx.font = '600 11px system-ui, sans-serif';
    this.ctx.fillStyle = '#b9e6ff';
    this.ctx.fillText(`${Math.round((this.truck.angle * 180) / Math.PI)} deg heading`, 28, 54);
    this.ctx.restore();
  }

  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: string,
  ): void {
    this.ctx.fillStyle = fill;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.ctx.fill();
  }

  private resizeCanvas(): void {
    const canvas = this.robotCanvas?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 320);
    const height = Math.max(Math.round(rect.height), 280);
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}
