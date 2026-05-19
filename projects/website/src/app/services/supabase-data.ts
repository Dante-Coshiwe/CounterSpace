import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
  interface Window {
    __env?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
}

export interface ProjectSnapshot {
  name: string;
  blocklyXml: string;
  generatedCode: string;
  arduinoCode: string;
  movementCommands: unknown[];
  ideComponents: Record<string, unknown>;
  boardConnections?: unknown[];
  simulatorState?: Record<string, unknown>;
  themeMode?: string;
  tutorialId?: string | null;
}

export interface IdeProject {
  id: string;
  user_id: string;
  name: string;
  blockly_xml: string;
  generated_code: string;
  arduino_code: string;
  movement_commands: unknown[];
  ide_components: Record<string, unknown>;
  board_connections?: unknown[];
  simulator_state?: Record<string, unknown>;
  theme_mode?: string;
  tutorial_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TutorialProgress {
  tutorial_id: string;
  completed: boolean;
  progress_percent: number;
  completed_at: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseDataService {
  private readonly client: SupabaseClient | null;

  constructor() {
    const url = window.__env?.SUPABASE_URL ?? '';
    const anonKey = window.__env?.SUPABASE_ANON_KEY ?? '';
    this.client = url && anonKey ? createClient(url, anonKey) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async signUp(username: string, email: string, password: string): Promise<AppUser> {
    const supabase = this.requireClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return a user.');

    await supabase.from('profiles').upsert({
      id: data.user.id,
      username,
      email: data.user.email ?? email,
    });

    return this.toAppUser(data.user, username);
  }

  async signIn(email: string, password: string): Promise<AppUser> {
    const supabase = this.requireClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return a user.');

    return this.toAppUser(data.user);
  }

  async signOut(): Promise<void> {
    const supabase = this.requireClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async currentUser(): Promise<AppUser | null> {
    const supabase = this.requireClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user ? this.toAppUser(data.user) : null;
  }

  async saveProject(snapshot: ProjectSnapshot): Promise<IdeProject> {
    const supabase = this.requireClient();
    const user = await this.requireUser();
    const { data, error } = await supabase
      .from('ide_projects')
      .upsert(
        {
          user_id: user.id,
          name: snapshot.name,
          blockly_xml: snapshot.blocklyXml,
          generated_code: snapshot.generatedCode,
          arduino_code: snapshot.arduinoCode,
          movement_commands: snapshot.movementCommands,
          ide_components: snapshot.ideComponents,
          board_connections: snapshot.boardConnections ?? [],
          simulator_state: snapshot.simulatorState ?? {},
          theme_mode: snapshot.themeMode ?? document.documentElement.dataset['theme'] ?? 'light',
          tutorial_id: snapshot.tutorialId ?? null,
        },
        { onConflict: 'user_id,name' },
      )
      .select()
      .single<IdeProject>();

    if (error) throw error;
    if (!data) throw new Error('Project was not saved.');
    return data;
  }

  async listProjects(): Promise<IdeProject[]> {
    const supabase = this.requireClient();
    const user = await this.requireUser();
    const { data, error } = await supabase
      .from('ide_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as IdeProject[];
  }

  async listTutorialProgress(): Promise<TutorialProgress[]> {
    const supabase = this.requireClient();
    const user = await this.requireUser();
    const { data, error } = await supabase
      .from('tutorial_progress')
      .select('tutorial_id, completed, progress_percent, completed_at')
      .eq('user_id', user.id);

    if (error) throw error;
    return (data ?? []) as TutorialProgress[];
  }

  async markTutorialComplete(tutorialId: string): Promise<void> {
    const supabase = this.requireClient();
    const user = await this.requireUser();
    const { error } = await supabase.from('tutorial_progress').upsert(
      {
        user_id: user.id,
        tutorial_id: tutorialId,
        completed: true,
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,tutorial_id' },
    );

    if (error) throw error;
  }

  private requireClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase is not configured. Fill in projects/website/public/env.js first.');
    }
    return this.client;
  }

  private async requireUser(): Promise<AppUser> {
    const user = await this.currentUser();
    if (!user) throw new Error('Please log in first.');
    return user;
  }

  private toAppUser(user: User, fallbackUsername = ''): AppUser {
    const metadata = user.user_metadata as Record<string, unknown>;
    const username = String(metadata['username'] ?? fallbackUsername ?? user.email?.split('@')[0] ?? 'Coder');

    return {
      id: user.id,
      username,
      email: user.email ?? '',
    };
  }
}
