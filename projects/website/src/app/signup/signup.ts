import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseDataService } from '../services/supabase-data';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'],
})
export class SignUp {
  username = '';
  email = '';
  password = '';
  message = '';
  isError = false;
  isBusy = false;

  constructor(
    private readonly supabase: SupabaseDataService,
    private readonly router: Router,
  ) {}

  async submit(): Promise<void> {
    this.message = '';
    this.isError = false;
    if (!this.username || !this.email || !this.password) {
      this.message = 'Please complete all fields.';
      this.isError = true;
      return;
    }

    this.isBusy = true;
    try {
      await this.supabase.signUp(this.username, this.email, this.password);
      this.message = 'Account created. Redirecting to IDE...';
      setTimeout(() => void this.router.navigateByUrl('/ide'), 700);
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not create account.';
      this.isError = true;
    } finally {
      this.isBusy = false;
    }
  }
}
