import { Component, signal } from '@angular/core';
import { RouterOutlet} from '@angular/router';
import {Header} from './components/site-ui';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('counterspace-ide-website');
  
}
