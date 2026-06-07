export interface Project {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
}

export interface Launch {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  rocket: string;
  details?: string | null;
}

export interface CelestialBody {
  id: string;
  label: string;
  value: string | number;
  type: 'launch' | 'crypto' | 'signal';
  color: string;
}

export type SectionId = 
  | 'hero' 
  | 'archive' 
  | 'codex' 
  | 'observatory' 
  | 'nexus' 
  | 'infinite';

export interface SceneState {
  intensity: number;      // 0-1 overall cosmic energy
  mouse: { x: number; y: number };
  scrollProgress: number; // 0-1 overall page
  currentSection: SectionId;
  climax: number;         // special convergence state 0-1
}
