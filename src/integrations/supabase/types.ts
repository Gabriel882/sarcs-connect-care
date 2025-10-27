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
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      emergency_alerts: {
        Row: {
          id: string
          title: string
          description: string
          severity: Database["public"]["Enums"]["alert_severity"]
          location: string
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          location: string
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          location?: string
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      volunteer_shifts: {
        Row: {
          id: string
          title: string
          description: string
          location: string
          start_time: string
          end_time: string
          max_volunteers: number
          current_volunteers: number
          status: Database["public"]["Enums"]["shift_status"]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          location: string
          start_time: string
          end_time: string
          max_volunteers?: number
          current_volunteers?: number
          status?: Database["public"]["Enums"]["shift_status"]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          start_time?: string
          end_time?: string
          max_volunteers?: number
          current_volunteers?: number
          status?: Database["public"]["Enums"]["shift_status"]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_shifts_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      shift_signups: {
        Row: {
          id: string
          shift_id: string
          volunteer_id: string
          status: Database["public"]["Enums"]["shift_signup_status"]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          volunteer_id: string
          status?: Database["public"]["Enums"]["shift_signup_status"]
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          volunteer_id?: string
          status?: Database["public"]["Enums"]["shift_signup_status"]
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_signups_shift_id_fkey"
            columns: ["shift_id"]
            referencedRelation: "volunteer_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_signups_volunteer_id_fkey"
            columns: ["volunteer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      donations: {
        Row: {
          id: string
          donor_id: string
          amount: number
          currency: string
          description: string | null
          payment_method: string | null
          payment_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          donor_id: string
          amount: number
          currency?: string
          description?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          donor_id?: string
          amount?: number
          currency?: string
          description?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey"
            columns: ["donor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }

    Views: {}

    Functions: {
      has_role: {
        Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }

    Enums: {
      app_role: "admin" | "volunteer" | "donor"
      alert_severity: "critical" | "high" | "medium" | "low"
      shift_status: "open" | "full" | "cancelled" | "completed"
      shift_signup_status: "confirmed" | "cancelled"
    }
  }
}
