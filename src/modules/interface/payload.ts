export interface iPayload {
  id: string;
  current: number;
}

export interface iGoalLog {
  id: string;
  head_target: number;
  day_end: number;
}

export interface iMainPayload {
  head_target: number;
  current: number;
  day_end: number;
  update: iPayload[];
  goal_log: iGoalLog[];
}
