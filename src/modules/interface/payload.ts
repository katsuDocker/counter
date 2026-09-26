export interface iPayload {
  id: string;
  current: number;
}

export interface iMainPayload {
  head_target: number;
  current: number;
  day_end: number;
  update: iPayload[];
}
