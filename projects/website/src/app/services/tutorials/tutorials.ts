import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Footer } from '../components/site-ui';

@Component({
  selector: 'app-tutorials',
  standalone: true,
  imports: [RouterLink, Footer],
  templateUrl: './tutorials.html',
  styleUrl: './tutorials.css',
})
export class Tutorials {}
