import { CommonModule } from '@angular/common';
import { Component, ContentChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import {
  AppUser,
  IdeProject,
  ProjectSnapshot,
  SupabaseDataService,
} from '../services/supabase-data';

interface SearchItem {
  label: string;
  description: string;
  route: string;
  keywords: string;
}

interface ProjectEditor {
  getProjectSnapshot(projectName: string): ProjectSnapshot;
  loadProjectSnapshot(project: IdeProject): void;
  clearWorkspace(): void;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    label: 'Home',
    description: 'Start page and quick links',
    route: '/home',
    keywords: 'home start counterspace',
  },
  {
    label: 'IDE',
    description: 'Blockly editor and truck simulator',
    route: '/ide',
    keywords: 'ide blockly editor blocks simulator truck project save open movement light',
  },
  {
    label: 'Tutorials',
    description: 'All learning missions in one place',
    route: '/tutorials',
    keywords: 'tutorials lessons learning missions',
  },
  {
    label: 'IDE Tutorials',
    description: 'Blockly, movement, loops, and light lessons',
    route: '/tutorials/ide',
    keywords: 'hello world math movement turns loops scratch light blocks',
  },
  {
    label: 'About',
    description: 'What Counterspace helps learners build',
    route: '/about',
    keywords: 'about counterspace robotics coding children',
  },
  {
    label: 'Sign Up',
    description: 'Create your Counterspace account',
    route: '/signup',
    keywords: 'signup sign up register account login',
  },
];

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="cs-auth-panel">
      <button class="cs-modal-close" type="button" aria-label="Close" (click)="close()">×</button>
      <p class="cs-eyebrow">{{ isLoginView ? 'Welcome back' : 'Create account' }}</p>
      <h2 class="cs-modal-title">{{ isLoginView ? 'Log in to Counterspace' : 'Start saving projects' }}</h2>

      <form class="cs-auth-form" (ngSubmit)="onSubmit()">
        <label *ngIf="!isLoginView">
          Display name
          <input name="username" [(ngModel)]="username" type="text" autocomplete="name" />
        </label>

        <label>
          Email
          <input name="email" [(ngModel)]="email" type="email" autocomplete="email" />
        </label>

        <label>
          Password
          <input
            name="password"
            [(ngModel)]="password"
            type="password"
            autocomplete="current-password"
          />
        </label>

        <button class="cs-btn cs-btn--primary cs-auth-submit" type="submit" [disabled]="isBusy">
          {{ isBusy ? 'Working...' : isLoginView ? 'Log in' : 'Sign up' }}
        </button>
      </form>

      <p *ngIf="message" class="cs-auth-message" [class.error]="isError">{{ message }}</p>

      <button class="cs-auth-link" type="button" (click)="toggleView()">
        {{ isLoginView ? 'Need an account?' : 'Already have an account?' }}
      </button>
    </section>
  `,
  styles: [],
})
export class AuthModal {
  isLoginView = true;
  username = '';
  email = '';
  password = '';
  message = '';
  isError = false;
  isBusy = false;

  constructor(
    public dialogRef: MatDialogRef<AuthModal>,
    private supabase: SupabaseDataService,
  ) {}

  toggleView(): void {
    this.isLoginView = !this.isLoginView;
    this.message = '';
    this.isError = false;
  }

  close(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    this.message = '';
    this.isError = false;

    if (!this.email || !this.password || (!this.isLoginView && !this.username)) {
      this.showError('Please fill in all fields.');
      return;
    }

    this.isBusy = true;
    try {
      const user = this.isLoginView
        ? await this.supabase.signIn(this.email, this.password)
        : await this.supabase.signUp(this.username, this.email, this.password);

      localStorage.setItem('counterspace-user', JSON.stringify(user));
      this.message = this.isLoginView
        ? `Welcome back, ${user.username}.`
        : `Account created for ${user.username}.`;
      setTimeout(() => this.dialogRef.close(user), 800);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      this.isBusy = false;
    }
  }

  private showError(message: string): void {
    this.message = message;
    this.isError = true;
  }
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="cs-site-header">
      <a class="cs-brand" routerLink="/home" aria-label="Counterspace home">
        <img src="images/logoImage.JPG" alt="Counterspace IDE Logo" />
        <span>Counterspace</span>
      </a>

      <button class="cs-menu-button" type="button" aria-label="Toggle navigation" (click)="toggleMenu()">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav class="cs-site-nav" [class.open]="isMenuOpen">
        <a routerLink="/home" (click)="closeMenu()">Home</a>
        <a routerLink="/tutorials" (click)="closeMenu()">Tutorials</a>
        <a routerLink="/ide" (click)="closeMenu()">IDE</a>
        <a routerLink="/about" (click)="closeMenu()">About</a>
        <a routerLink="/signup" (click)="closeMenu()">Sign Up</a>
      </nav>

      <form class="cs-search-box" (ngSubmit)="submitSearch()">
        <input
          name="search"
          type="search"
          autocomplete="off"
          placeholder="Search lessons, blocks, pages"
          [(ngModel)]="searchTerm"
          (focus)="searchOpen = true"
        />
        <button type="submit" aria-label="Search">Search</button>

        <div class="cs-search-results" *ngIf="searchOpen && filteredSearchItems.length > 0">
          <button
            type="button"
            *ngFor="let item of filteredSearchItems"
            (click)="goTo(item.route)"
          >
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </button>
        </div>
      </form>

      <div class="cs-header-actions">
        <button
          class="cs-theme-toggle"
          type="button"
          (click)="toggleTheme()"
          [attr.aria-label]="themeMode === 'night' ? 'Switch to light mode' : 'Switch to night mode'"
        >
          <span>{{ themeMode === 'night' ? 'Light' : 'Night' }}</span>
        </button>

        <ng-container *ngIf="user; else loggedOut">
          <div class="cs-auth-user">
            <strong>{{ user.username }}</strong>
            <span>{{ user.email }}</span>
          </div>
          <button class="cs-signout-button" type="button" (click)="signOut()">Sign out</button>
        </ng-container>
        <ng-template #loggedOut>
          <button class="cs-login-button" type="button" (click)="openAuthModal()">Log in</button>
        </ng-template>
      </div>
    </header>
  `,
  styles: [],
})
export class Header implements OnInit {
  isMenuOpen = false;
  searchTerm = '';
  searchOpen = false;
  themeMode: 'light' | 'night' = 'light';
  user: AppUser | null = null;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private supabase: SupabaseDataService,
  ) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.closeMenu();
      this.searchOpen = false;
    });
  }

  get filteredSearchItems(): SearchItem[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return SEARCH_ITEMS.slice(0, 4);
    return SEARCH_ITEMS.filter((item) =>
      `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(query),
    ).slice(0, 5);
  }

  async ngOnInit(): Promise<void> {
    this.themeMode =
      (localStorage.getItem('counterspace-theme') as 'light' | 'night' | null) ?? 'light';
    this.applyTheme();

    try {
      this.user = await this.supabase.currentUser();
      if (!this.user) {
        const raw = localStorage.getItem('counterspace-user');
        if (raw) this.user = JSON.parse(raw) as AppUser;
      }
    } catch {
      this.user = null;
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  submitSearch(): void {
    const [firstResult] = this.filteredSearchItems;
    if (firstResult) this.goTo(firstResult.route);
  }

  goTo(route: string): void {
    this.searchOpen = false;
    void this.router.navigateByUrl(route);
  }

  openAuthModal(): void {
    const dialogRef = this.dialog.open(AuthModal, {
      width: '460px',
      panelClass: 'counterspace-dialog',
    });

    dialogRef.afterClosed().subscribe((user: AppUser | undefined) => {
      if (user) this.user = user;
    });
  }

  toggleTheme(): void {
    this.themeMode = this.themeMode === 'night' ? 'light' : 'night';
    localStorage.setItem('counterspace-theme', this.themeMode);
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.dataset['theme'] = this.themeMode;
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.signOut();
    } catch {
      // Keep UI consistent even if auth provider is unreachable.
    } finally {
      this.user = null;
      localStorage.removeItem('counterspace-user');
    }
  }
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="cs-ide-shell">
      <div class="cs-ide-toolbar">
        <div class="cs-ide-toolbar-left">
          <button type="button" (click)="newProject()">New</button>
          <button type="button" (click)="saveProject()" [disabled]="isBusy">Save</button>
          <button type="button" (click)="openProjects()" [disabled]="isBusy">Open</button>
          <button type="button" class="cs-ide-fullscreen" (click)="toggleFullscreen()">
            {{ isFullscreen ? 'Exit full screen' : 'Full screen' }}
          </button>
        </div>

        <label class="cs-ide-project-name">
          <span>Project</span>
          <input
            class="project-name-input"
            type="text"
            [(ngModel)]="projectName"
            placeholder="Untitled Project"
          />
        </label>

        <p class="cs-ide-toolbar-msg" *ngIf="message" [class.error]="isError">{{ message }}</p>
      </div>

      <div class="cs-ide-project-list" *ngIf="projects.length > 0">
        <button type="button" *ngFor="let project of projects" (click)="loadProject(project)">
          <strong>{{ project.name }}</strong>
          <span>{{ project.updated_at | date: 'short' }}</span>
        </button>
      </div>

      <div class="cs-ide-content">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [],
})
export class Toolbar {
  projectName = '';
  message = '';
  isError = false;
  isBusy = false;
  isFullscreen = false;
  projects: IdeProject[] = [];

  @ContentChild('projectCode') projectedEditor?: ProjectEditor;

  constructor(private supabase: SupabaseDataService) {}

  newProject(): void {
    this.projectName = '';
    this.projects = [];
    this.projectedEditor?.clearWorkspace();
    this.showMessage('Fresh project ready.');
  }

  async saveProject(): Promise<void> {
    if (!this.projectedEditor) {
      this.showError('The Blockly editor is still loading.');
      return;
    }

    const name = this.projectName.trim();
    if (!name) {
      this.showError('Give your project a name first.');
      return;
    }

    this.isBusy = true;
    try {
      await this.supabase.saveProject(this.projectedEditor.getProjectSnapshot(name));
      this.showMessage(`Saved ${name}.`);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Could not save project.');
    } finally {
      this.isBusy = false;
    }
  }

  async openProjects(): Promise<void> {
    this.isBusy = true;
    try {
      this.projects = await this.supabase.listProjects();
      this.showMessage(this.projects.length ? 'Pick a project below.' : 'No saved projects yet.');
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Could not load projects.');
    } finally {
      this.isBusy = false;
    }
  }

  loadProject(project: IdeProject): void {
    this.projectName = project.name;
    this.projectedEditor?.loadProjectSnapshot(project);
    this.projects = [];
    this.showMessage(`Opened ${project.name}.`);
  }

  async toggleFullscreen(): Promise<void> {
    const shell = document.querySelector('.cs-ide-shell') as HTMLElement | null;
    if (!shell) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        this.isFullscreen = false;
      } else {
        await shell.requestFullscreen();
        this.isFullscreen = true;
      }
    } catch {
      this.showError('Fullscreen is blocked by this browser.');
    }
  }

  private showMessage(message: string): void {
    this.message = message;
    this.isError = false;
  }

  private showError(message: string): void {
    this.message = message;
    this.isError = true;
  }
}

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="cs-site-footer">
      <strong>Counterspace IDE</strong>
      <span>Learn robotics with a consistent, premium experience.</span>
    </footer>
  `,
  styles: [],
})
export class Footer {}
