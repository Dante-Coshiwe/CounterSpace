import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Footer } from '../components/site-ui';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Footer, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {

}
