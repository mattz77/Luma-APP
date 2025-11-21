type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string;
          house_id: string;
          id: string;
          metadata: Json | null;
          message: string;
          response: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          house_id: string;
          id?: string;
          metadata?: Json | null;
          message: string;
          response?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          house_id?: string;
          id?: string;
          metadata?: Json | null;
          message?: string;
          response?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      device_actions: {
        Row: {
          action: string;
          device_id: string;
          executed_at: string;
          id: string;
          parameters: Json | null;
          result: Json | null;
          status: string;
        };
        Insert: {
          action: string;
          device_id: string;
          executed_at?: string;
          id?: string;
          parameters?: Json | null;
          result?: Json | null;
          status?: string;
        };
        Update: {
          action?: string;
          device_id?: string;
          executed_at?: string;
          id?: string;
          parameters?: Json | null;
          result?: Json | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'device_actions_device_id_fkey';
            columns: ['device_id'];
            referencedRelation: 'devices';
            referencedColumns: ['id'];
          },
        ];
      };
      devices: {
        Row: {
          api_endpoint: string | null;
          api_key: string | null;
          brand: string | null;
          capabilities: string[];
          created_at: string;
          house_id: string;
          id: string;
          is_online: boolean;
          last_seen_at: string | null;
          metadata: Json | null;
          model: string | null;
          name: string;
          room: string | null;
          type: Database['public']['Enums']['device_type'];
          updated_at: string;
        };
        Insert: {
          api_endpoint?: string | null;
          api_key?: string | null;
          brand?: string | null;
          capabilities?: string[];
          created_at?: string;
          house_id: string;
          id?: string;
          is_online?: boolean;
          last_seen_at?: string | null;
          metadata?: Json | null;
          model?: string | null;
          name: string;
          room?: string | null;
          type: Database['public']['Enums']['device_type'];
          updated_at?: string;
        };
        Update: {
          api_endpoint?: string | null;
          api_key?: string | null;
          brand?: string | null;
          capabilities?: string[];
          created_at?: string;
          house_id?: string;
          id?: string;
          is_online?: boolean;
          last_seen_at?: string | null;
          metadata?: Json | null;
          model?: string | null;
          name?: string;
          room?: string | null;
          type?: Database['public']['Enums']['device_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'devices_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
        ];
      };
      expense_categories: {
        Row: {
          created_at: string;
          house_id: string;
          icon: string | null;
          id: string;
          name: string;
          color: string | null;
        };
        Insert: {
          created_at?: string;
          house_id: string;
          icon?: string | null;
          id?: string;
          name: string;
          color?: string | null;
        };
        Update: {
          created_at?: string;
          house_id?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          color?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_categories_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
        ];
      };
      expense_splits: {
        Row: {
          amount: string;
          expense_id: string;
          id: string;
          is_paid: boolean;
          user_id: string;
        };
        Insert: {
          amount: string;
          expense_id: string;
          id?: string;
          is_paid?: boolean;
          user_id: string;
        };
        Update: {
          amount?: string;
          expense_id?: string;
          id?: string;
          is_paid?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_splits_expense_id_fkey';
            columns: ['expense_id'];
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_splits_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          amount: string;
          category_id: string | null;
          created_at: string;
          created_by_id: string;
          description: string;
          expense_date: string;
          house_id: string;
          id: string;
          is_paid: boolean;
          is_recurring: boolean;
          notes: string | null;
          paid_at: string | null;
          receipt_url: string | null;
          recurrence_period: string | null;
          updated_at: string;
        };
        Insert: {
          amount: string;
          category_id?: string | null;
          created_at?: string;
          created_by_id: string;
          description: string;
          expense_date: string;
          house_id: string;
          id?: string;
          is_paid?: boolean;
          is_recurring?: boolean;
          notes?: string | null;
          paid_at?: string | null;
          receipt_url?: string | null;
          recurrence_period?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: string;
          category_id?: string | null;
          created_at?: string;
          created_by_id?: string;
          description?: string;
          expense_date?: string;
          house_id?: string;
          id?: string;
          is_paid?: boolean;
          is_recurring?: boolean;
          notes?: string | null;
          paid_at?: string | null;
          receipt_url?: string | null;
          recurrence_period?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'expense_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_created_by_id_fkey';
            columns: ['created_by_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
        ];
      };
      house_members: {
        Row: {
          house_id: string;
          id: string;
          is_active: boolean;
          joined_at: string;
          role: Database['public']['Enums']['house_member_role'];
          user_id: string;
        };
        Insert: {
          house_id: string;
          id?: string;
          is_active?: boolean;
          joined_at?: string;
          role?: Database['public']['Enums']['house_member_role'];
          user_id: string;
        };
        Update: {
          house_id?: string;
          id?: string;
          is_active?: boolean;
          joined_at?: string;
          role?: Database['public']['Enums']['house_member_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'house_members_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'house_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      houses: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
          photo_url: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          invite_code?: string;
          name: string;
          photo_url?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          invite_code?: string;
          name?: string;
          photo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      monthly_budgets: {
        Row: {
          amount: string;
          created_at: string;
          house_id: string;
          id: string;
          month: string;
          updated_at: string;
        };
        Insert: {
          amount: string;
          created_at?: string;
          house_id: string;
          id?: string;
          month: string;
          updated_at?: string;
        };
        Update: {
          amount?: string;
          created_at?: string;
          house_id?: string;
          id?: string;
          month?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_budgets_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          house_id: string;
          id: string;
          is_read: boolean;
          metadata: Json | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          house_id: string;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          house_id?: string;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      task_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          task_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          task_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_comments_task_id_fkey';
            columns: ['task_id'];
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_comments_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          assigned_to_id: string | null;
          completed_at: string | null;
          created_at: string;
          created_by_id: string;
          description: string | null;
          due_date: string | null;
          house_id: string;
          id: string;
          is_recurring: boolean;
          points: number;
          priority: Database['public']['Enums']['task_priority'];
          recurrence: string | null;
          status: Database['public']['Enums']['task_status'];
          tags: string[];
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_to_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by_id: string;
          description?: string | null;
          due_date?: string | null;
          house_id: string;
          id?: string;
          is_recurring?: boolean;
          points?: number;
          priority?: Database['public']['Enums']['task_priority'];
          recurrence?: string | null;
          status?: Database['public']['Enums']['task_status'];
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_to_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by_id?: string;
          description?: string | null;
          due_date?: string | null;
          house_id?: string;
          id?: string;
          is_recurring?: boolean;
          points?: number;
          priority?: Database['public']['Enums']['task_priority'];
          recurrence?: string | null;
          status?: Database['public']['Enums']['task_status'];
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_assigned_to_id_fkey';
            columns: ['assigned_to_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_id_fkey';
            columns: ['created_by_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_house_id_fkey';
            columns: ['house_id'];
            referencedRelation: 'houses';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          id: string;
          last_login_at: string | null;
          name: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          last_login_at?: string | null;
          name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          last_login_at?: string | null;
          name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: never;
    Functions: never;
    Enums: {
      device_type:
        | 'VACUUM_ROBOT'
        | 'VOICE_ASSISTANT'
        | 'CAMERA'
        | 'THERMOSTAT'
        | 'LOCK'
        | 'LIGHT'
        | 'SENSOR'
        | 'OTHER';
      house_member_role: 'ADMIN' | 'MEMBER' | 'VIEWER';
      task_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      task_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    };
    CompositeTypes: never;
  };
}

