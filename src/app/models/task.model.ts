export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
  userId?: string;
  _unsynced?: boolean; // True if created or updated offline and not yet confirmed by server
  _isNewOffline?: boolean; // True if created offline (needs POST during sync)
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  totalPages: number;
}

export interface User {
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WebSocketEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
