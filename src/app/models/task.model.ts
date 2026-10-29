export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
}

export interface WebSocketEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}
