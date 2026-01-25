/**
 * Dashboard TypeScript type definitions
 *
 * Types for task visualization, phase tracking, and SSE communication
 */

export type TaskStatus = 'pending' | 'in-progress' | 'complete';

export type Task = {
  id: string;           // "05-01" (phase-plan)
  phase: string;        // "05-execution-flow"
  plan: number;         // 1
  wave: number;         // 1
  dependsOn: string[];  // ["05-00"]
  status: TaskStatus;
  name?: string;        // From objective section
  summary?: string;     // From SUMMARY.md if exists
  duration?: string;    // From SUMMARY.md
  completedAt?: string; // From SUMMARY.md
  filesModified?: string[]; // From frontmatter
};

export type Phase = {
  id: number;           // 5
  name: string;         // "execution-flow"
  fullName: string;     // "05-execution-flow"
  status: 'complete' | 'in-progress' | 'pending';
  plansTotal: number;
  plansComplete: number;
};

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export type DashboardState = {
  tasks: Task[];
  phases: Phase[];
  currentPhase: number;
  currentPlan: number;
  roadmap: string;      // Raw ROADMAP.md for rendering
  connectionStatus: ConnectionStatus;
};

export type FileChangeEvent = {
  event: 'add' | 'change' | 'unlink';
  path: string;
  data?: Task | Phase | DashboardState;
};

export type SSEMessage = {
  type: 'initial' | 'update' | 'heartbeat';
  payload: DashboardState | FileChangeEvent | null;
};
