export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      goals: {
        Row: {
          id: string;
          user_id: string;
          type: 'meters' | 'workouts';
          period: 'yearly' | 'monthly' | 'weekly';
          target_value: number;
          start_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type: 'meters' | 'workouts';
          period: 'yearly' | 'monthly' | 'weekly';
          target_value: number;
          start_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'meters' | 'workouts';
          period?: 'yearly' | 'monthly' | 'weekly';
          target_value?: number;
          start_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      goal_type: 'meters' | 'workouts';
      goal_period: 'yearly' | 'monthly' | 'weekly';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
} 