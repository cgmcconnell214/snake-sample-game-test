export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_links: {
        Row: {
          id: string
          is_primary: boolean | null
          linked_at: string
          provider: string
          provider_email: string | null
          provider_id: string
          provider_metadata: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          linked_at?: string
          provider: string
          provider_email?: string | null
          provider_id: string
          provider_metadata?: Json | null
          user_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          linked_at?: string
          provider?: string
          provider_email?: string | null
          provider_id?: string
          provider_metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      agent_api_keys: {
        Row: {
          agent_id: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string | null
          revoked_at: string | null
          revoked_by: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Relationships: []
      }
      ai_agent_execution_logs: {
        Row: {
          agent_id: string | null
          created_at: string | null
          data: Json | null
          execution_id: string | null
          id: string
          log_level: string | null
          message: string
          step_id: string | null
          step_name: string | null
          timestamp: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          data?: Json | null
          execution_id?: string | null
          id?: string
          log_level?: string | null
          message: string
          step_id?: string | null
          step_name?: string | null
          timestamp?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          data?: Json | null
          execution_id?: string | null
          id?: string
          log_level?: string | null
          message?: string
          step_id?: string | null
          step_name?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_execution_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_execution_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_executions: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json
          output_data: Json | null
          started_at: string
          status: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          started_at?: string
          status?: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_purchases: {
        Row: {
          agent_id: string
          buyer_id: string
          created_at: string
          id: string
          payment_status: string
          tokens_purchased: number
          total_amount: number
        }
        Insert: {
          agent_id: string
          buyer_id: string
          created_at?: string
          id?: string
          payment_status?: string
          tokens_purchased: number
          total_amount: number
        }
        Update: {
          agent_id?: string
          buyer_id?: string
          created_at?: string
          id?: string
          payment_status?: string
          tokens_purchased?: number
          total_amount?: number
        }
        Relationships: []
      }
      ai_agent_secrets: {
        Row: {
          agent_id: string
          created_at: string
          secrets: Json
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          secrets?: Json
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          secrets?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          agent_type: string
          category: string
          configuration: Json
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_per_use: number
          tokens_sold: number
          total_tokens: number
          updated_at: string
          verification_status: string
          workflow_data: Json
        }
        Insert: {
          agent_type?: string
          category: string
          configuration?: Json
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_per_use?: number
          tokens_sold?: number
          total_tokens?: number
          updated_at?: string
          verification_status?: string
          workflow_data?: Json
        }
        Update: {
          agent_type?: string
          category?: string
          configuration?: Json
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_per_use?: number
          tokens_sold?: number
          total_tokens?: number
          updated_at?: string
          verification_status?: string
          workflow_data?: Json
        }
        Relationships: []
      }
      application_logs: {
        Row: {
          component: string | null
          context: Json | null
          created_at: string | null
          error_data: Json | null
          function_name: string | null
          id: string
          ip_address: unknown | null
          level: string
          message: string
          metadata: Json | null
          request_id: string | null
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_data?: Json | null
          function_name?: string | null
          id?: string
          ip_address?: unknown | null
          level: string
          message: string
          metadata?: Json | null
          request_id?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          context?: Json | null
          created_at?: string | null
          error_data?: Json | null
          function_name?: string | null
          id?: string
          ip_address?: unknown | null
          level?: string
          message?: string
          metadata?: Json | null
          request_id?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      asset_holdings: {
        Row: {
          asset_id: string
          balance: number | null
          id: string
          last_updated: string | null
          locked_balance: number | null
          user_id: string
        }
        Insert: {
          asset_id: string
          balance?: number | null
          id?: string
          last_updated?: string | null
          locked_balance?: number | null
          user_id: string
        }
        Update: {
          asset_id?: string
          balance?: number | null
          id?: string
          last_updated?: string | null
          locked_balance?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_holdings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "tokenized_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attempt_number: number | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          student_id: string
          submission_data: Json | null
          submitted_at: string | null
          time_spent_minutes: number | null
        }
        Insert: {
          assignment_id: string
          attempt_number?: number | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id: string
          submission_data?: Json | null
          submitted_at?: string | null
          time_spent_minutes?: number | null
        }
        Update: {
          assignment_id?: string
          attempt_number?: number | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submission_data?: Json | null
          submitted_at?: string | null
          time_spent_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_event_details: {
        Row: {
          compliance_flags: string[] | null
          created_at: string
          error_details: Json | null
          event_id: string
          execution_time_ms: number | null
          id: string
          request_data: Json | null
          response_data: Json | null
          security_context: Json | null
        }
        Insert: {
          compliance_flags?: string[] | null
          created_at?: string
          error_details?: Json | null
          event_id: string
          execution_time_ms?: number | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          security_context?: Json | null
        }
        Update: {
          compliance_flags?: string[] | null
          created_at?: string
          error_details?: Json | null
          event_id?: string
          execution_time_ms?: number | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          security_context?: Json | null
        }
        Relationships: []
      }
      blockchain_transaction_queue: {
        Row: {
          compliance_check_status: Json | null
          created_at: string
          error_message: string | null
          function_name: string
          gas_used: number | null
          id: string
          parameters: Json
          retry_count: number | null
          status: string | null
          transaction_type: string
          updated_at: string
          user_id: string | null
          xrpl_ledger_index: number | null
          xrpl_transaction_hash: string | null
        }
        Insert: {
          compliance_check_status?: Json | null
          created_at?: string
          error_message?: string | null
          function_name: string
          gas_used?: number | null
          id?: string
          parameters: Json
          retry_count?: number | null
          status?: string | null
          transaction_type: string
          updated_at?: string
          user_id?: string | null
          xrpl_ledger_index?: number | null
          xrpl_transaction_hash?: string | null
        }
        Update: {
          compliance_check_status?: Json | null
          created_at?: string
          error_message?: string | null
          function_name?: string
          gas_used?: number | null
          id?: string
          parameters?: Json
          retry_count?: number | null
          status?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
          xrpl_ledger_index?: number | null
          xrpl_transaction_hash?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          badge_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number | null
          requirements: Json | null
          skill_level: string | null
          updated_at: string | null
        }
        Insert: {
          badge_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required?: number | null
          requirements?: Json | null
          skill_level?: string | null
          updated_at?: string | null
        }
        Update: {
          badge_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number | null
          requirements?: Json | null
          skill_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      class_attendees: {
        Row: {
          attendance_status: string
          attendee_id: string
          class_id: string
          id: string
          payment_amount: number
          registration_date: string
        }
        Insert: {
          attendance_status?: string
          attendee_id: string
          class_id: string
          id?: string
          payment_amount?: number
          registration_date?: string
        }
        Update: {
          attendance_status?: string
          attendee_id?: string
          class_id?: string
          id?: string
          payment_amount?: number
          registration_date?: string
        }
        Relationships: []
      }
      class_sessions: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          attendance_count: number | null
          class_id: string
          created_at: string | null
          id: string
          recording_url: string | null
          session_date: string
          session_notes: string | null
          status: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          attendance_count?: number | null
          class_id: string
          created_at?: string | null
          id?: string
          recording_url?: string | null
          session_date: string
          session_notes?: string | null
          status?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          attendance_count?: number | null
          class_id?: string
          created_at?: string | null
          id?: string
          recording_url?: string | null
          session_date?: string
          session_notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "live_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["compliance_risk"]
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["compliance_risk"]
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["compliance_risk"]
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_monitoring: {
        Row: {
          compliance_data: Json | null
          compliance_type: string
          created_at: string
          flags: string[] | null
          id: string
          regulatory_framework: string | null
          review_required: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_score: number | null
          status: string
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          compliance_data?: Json | null
          compliance_type: string
          created_at?: string
          flags?: string[] | null
          id?: string
          regulatory_framework?: string | null
          review_required?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          status: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          compliance_data?: Json | null
          compliance_type?: string
          created_at?: string
          flags?: string[] | null
          id?: string
          regulatory_framework?: string | null
          review_required?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          status?: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_monitoring_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "blockchain_transaction_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          assignment_type: string | null
          attempts_allowed: number | null
          course_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_required: boolean | null
          lesson_id: string | null
          max_score: number | null
          passing_score: number | null
          questions: Json | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_type?: string | null
          attempts_allowed?: number | null
          course_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          max_score?: number | null
          passing_score?: number | null
          questions?: Json | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_type?: string | null
          attempts_allowed?: number | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string | null
          max_score?: number | null
          passing_score?: number | null
          questions?: Json | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_creator_drafts: {
        Row: {
          created_at: string
          expires_at: string | null
          max_uses: number
          selected_course_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          max_uses?: number
          selected_course_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          max_uses?: number
          selected_course_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_creator_drafts_selected_course_id_fkey"
            columns: ["selected_course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_discussions: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          id: string
          is_instructor_post: boolean | null
          is_pinned: boolean | null
          lesson_id: string | null
          reply_to_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          id?: string
          is_instructor_post?: boolean | null
          is_pinned?: boolean | null
          lesson_id?: string | null
          reply_to_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          id?: string
          is_instructor_post?: boolean | null
          is_pinned?: boolean | null
          lesson_id?: string | null
          reply_to_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_discussions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_discussions_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "course_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollment_links: {
        Row: {
          code: string
          course_id: string
          created_at: string
          creator_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          used_count: number
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          creator_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          creator_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completion_status: string
          course_id: string
          created_at: string
          enrollment_date: string
          id: string
          payment_amount: number
          payment_provider: string | null
          payment_status: string | null
          progress_data: Json
          student_id: string
        }
        Insert: {
          completion_status?: string
          course_id: string
          created_at?: string
          enrollment_date?: string
          id?: string
          payment_amount: number
          payment_provider?: string | null
          payment_status?: string | null
          progress_data?: Json
          student_id: string
        }
        Update: {
          completion_status?: string
          course_id?: string
          created_at?: string
          enrollment_date?: string
          id?: string
          payment_amount?: number
          payment_provider?: string | null
          payment_status?: string | null
          progress_data?: Json
          student_id?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean | null
          lesson_number: number
          lesson_type: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          lesson_number: number
          lesson_type?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          lesson_number?: number
          lesson_type?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          lesson_id: string | null
          notes: string | null
          progress_percentage: number | null
          student_id: string
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          notes?: string | null
          progress_percentage?: number | null
          student_id: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          notes?: string | null
          progress_percentage?: number | null
          student_id?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          rating: number
          review_text: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating: number
          review_text?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating?: number
          review_text?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_skills: {
        Row: {
          course_id: string
          id: string
          proficiency_level: string | null
          skill_id: string
        }
        Insert: {
          course_id: string
          id?: string
          proficiency_level?: string | null
          skill_id: string
        }
        Update: {
          course_id?: string
          id?: string
          proficiency_level?: string | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      divine_trust_documents: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          content: string
          created_at: string
          creator_id: string
          document_data: Json
          document_type: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          content: string
          created_at?: string
          creator_id: string
          document_data?: Json
          document_type: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          created_at?: string
          creator_id?: string
          document_data?: Json
          document_type?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      educational_courses: {
        Row: {
          category: string
          course_content: Json
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_published: boolean
          price_per_student: number
          requirements: Json
          slug: string | null
          title: string
          total_students: number
          updated_at: string
        }
        Insert: {
          category: string
          course_content?: Json
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_published?: boolean
          price_per_student?: number
          requirements?: Json
          slug?: string | null
          title: string
          total_students?: number
          updated_at?: string
        }
        Update: {
          category?: string
          course_content?: Json
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_published?: boolean
          price_per_student?: number
          requirements?: Json
          slug?: string | null
          title?: string
          total_students?: number
          updated_at?: string
        }
        Relationships: []
      }
      escrow_vaults: {
        Row: {
          asset_id: string | null
          beneficiaries: Json
          created_at: string
          creator_id: string
          description: string | null
          id: string
          locked_amount: number
          status: string
          unlock_conditions: Json
          unlock_date: string | null
          updated_at: string
          vault_name: string
        }
        Insert: {
          asset_id?: string | null
          beneficiaries?: Json
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          locked_amount?: number
          status?: string
          unlock_conditions?: Json
          unlock_date?: string | null
          updated_at?: string
          vault_name: string
        }
        Update: {
          asset_id?: string | null
          beneficiaries?: Json
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          locked_amount?: number
          status?: string
          unlock_conditions?: Json
          unlock_date?: string | null
          updated_at?: string
          vault_name?: string
        }
        Relationships: []
      }
      ip_assets: {
        Row: {
          annual_revenue: number | null
          annual_yield_percentage: number | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          ip_type: string
          is_active: boolean | null
          legal_documents: Json | null
          metadata: Json | null
          min_stake_period_days: number | null
          name: string
          staking_enabled: boolean | null
          tokens_per_dollar: number | null
          total_tokens: number
          updated_at: string | null
          valuation: number | null
          verification_status: string | null
        }
        Insert: {
          annual_revenue?: number | null
          annual_yield_percentage?: number | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          ip_type: string
          is_active?: boolean | null
          legal_documents?: Json | null
          metadata?: Json | null
          min_stake_period_days?: number | null
          name: string
          staking_enabled?: boolean | null
          tokens_per_dollar?: number | null
          total_tokens: number
          updated_at?: string | null
          valuation?: number | null
          verification_status?: string | null
        }
        Update: {
          annual_revenue?: number | null
          annual_yield_percentage?: number | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          ip_type?: string
          is_active?: boolean | null
          legal_documents?: Json | null
          metadata?: Json | null
          min_stake_period_days?: number | null
          name?: string
          staking_enabled?: boolean | null
          tokens_per_dollar?: number | null
          total_tokens?: number
          updated_at?: string | null
          valuation?: number | null
          verification_status?: string | null
        }
        Relationships: []
      }
      ip_token_holdings: {
        Row: {
          accumulated_rewards: number | null
          created_at: string | null
          holder_id: string
          id: string
          ip_asset_id: string
          last_reward_calculation: string | null
          stake_end_date: string | null
          stake_start_date: string | null
          tokens_held: number
          tokens_staked: number | null
          updated_at: string | null
        }
        Insert: {
          accumulated_rewards?: number | null
          created_at?: string | null
          holder_id: string
          id?: string
          ip_asset_id: string
          last_reward_calculation?: string | null
          stake_end_date?: string | null
          stake_start_date?: string | null
          tokens_held?: number
          tokens_staked?: number | null
          updated_at?: string | null
        }
        Update: {
          accumulated_rewards?: number | null
          created_at?: string | null
          holder_id?: string
          id?: string
          ip_asset_id?: string
          last_reward_calculation?: string | null
          stake_end_date?: string | null
          stake_start_date?: string | null
          tokens_held?: number
          tokens_staked?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_token_holdings_ip_asset_id_fkey"
            columns: ["ip_asset_id"]
            isOneToOne: false
            referencedRelation: "ip_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      kingdom_entry_records: {
        Row: {
          created_at: string
          document_refs: Json
          entry_data: Json
          entry_type: string
          id: string
          trust_level: number
          user_id: string
          witness_signatures: Json
        }
        Insert: {
          created_at?: string
          document_refs?: Json
          entry_data?: Json
          entry_type: string
          id?: string
          trust_level?: number
          user_id: string
          witness_signatures?: Json
        }
        Update: {
          created_at?: string
          document_refs?: Json
          entry_data?: Json
          entry_type?: string
          id?: string
          trust_level?: number
          user_id?: string
          witness_signatures?: Json
        }
        Relationships: []
      }
      kyc_verification: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          id: string
          metadata: Json | null
          risk_score: number | null
          updated_at: string | null
          user_id: string
          verification_date: string | null
          verification_status: Database["public"]["Enums"]["kyc_status"] | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          risk_score?: number | null
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
          verification_status?: Database["public"]["Enums"]["kyc_status"] | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          risk_score?: number | null
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
          verification_status?: Database["public"]["Enums"]["kyc_status"] | null
        }
        Relationships: []
      }
      learning_path_courses: {
        Row: {
          course_id: string
          id: string
          is_required: boolean | null
          learning_path_id: string
          sequence_order: number
        }
        Insert: {
          course_id: string
          id?: string
          is_required?: boolean | null
          learning_path_id: string
          sequence_order: number
        }
        Update: {
          course_id?: string
          id?: string
          is_required?: boolean | null
          learning_path_id?: string
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_enrollments: {
        Row: {
          completed_at: string | null
          current_course_id: string | null
          enrolled_at: string | null
          id: string
          learning_path_id: string
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_course_id?: string | null
          enrolled_at?: string | null
          id?: string
          learning_path_id: string
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_course_id?: string | null
          enrolled_at?: string | null
          id?: string
          learning_path_id?: string
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_enrollments_current_course_id_fkey"
            columns: ["current_course_id"]
            isOneToOne: false
            referencedRelation: "educational_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_enrollments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          difficulty_level: string | null
          estimated_duration_weeks: number | null
          id: string
          is_public: boolean | null
          name: string
          outcomes: Json | null
          prerequisites: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          outcomes?: Json | null
          prerequisites?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          outcomes?: Json | null
          prerequisites?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      liquidity_pool_positions: {
        Row: {
          created_at: string
          current_value: number
          entry_price: number
          id: string
          is_active: boolean
          lp_tokens: number
          pool_id: string
          rewards_earned: number
          stake_end_date: string | null
          stake_start_date: string | null
          token_a_amount: number
          token_b_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          entry_price: number
          id?: string
          is_active?: boolean
          lp_tokens?: number
          pool_id: string
          rewards_earned?: number
          stake_end_date?: string | null
          stake_start_date?: string | null
          token_a_amount?: number
          token_b_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          entry_price?: number
          id?: string
          is_active?: boolean
          lp_tokens?: number
          pool_id?: string
          rewards_earned?: number
          stake_end_date?: string | null
          stake_start_date?: string | null
          token_a_amount?: number
          token_b_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      live_classes: {
        Row: {
          class_type: string
          created_at: string
          description: string | null
          duration_minutes: number
          host_id: string
          id: string
          is_monetized: boolean
          max_attendees: number | null
          price_per_attendee: number
          scheduled_at: string
          title: string
          zoom_meeting_id: string | null
          zoom_password: string | null
        }
        Insert: {
          class_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id: string
          id?: string
          is_monetized?: boolean
          max_attendees?: number | null
          price_per_attendee?: number
          scheduled_at: string
          title: string
          zoom_meeting_id?: string | null
          zoom_password?: string | null
        }
        Update: {
          class_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id?: string
          id?: string
          is_monetized?: boolean
          max_attendees?: number | null
          price_per_attendee?: number
          scheduled_at?: string
          title?: string
          zoom_meeting_id?: string | null
          zoom_password?: string | null
        }
        Relationships: []
      }
      market_data: {
        Row: {
          asset_id: string
          created_at: string
          current_price: number
          high_24h: number
          id: string
          last_updated: string
          low_24h: number
          market_cap: number
          price_change_24h: number
          volume_24h: number
        }
        Insert: {
          asset_id: string
          created_at?: string
          current_price?: number
          high_24h?: number
          id?: string
          last_updated?: string
          low_24h?: number
          market_cap?: number
          price_change_24h?: number
          volume_24h?: number
        }
        Update: {
          asset_id?: string
          created_at?: string
          current_price?: number
          high_24h?: number
          id?: string
          last_updated?: string
          low_24h?: number
          market_cap?: number
          price_change_24h?: number
          volume_24h?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_data_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "tokenized_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_access_tokens: {
        Row: {
          access_token: string
          attendee_id: string
          class_id: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
        }
        Insert: {
          access_token: string
          attendee_id: string
          class_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean
        }
        Update: {
          access_token?: string
          attendee_id?: string
          class_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "meeting_access_tokens_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "live_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_credentials: {
        Row: {
          access_token: string | null
          class_id: string
          created_at: string
          expires_at: string | null
          host_key: string | null
          id: string
          is_active: boolean
          meeting_id: string
          meeting_url: string
          participant_key: string | null
          provider: string
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          class_id: string
          created_at?: string
          expires_at?: string | null
          host_key?: string | null
          id?: string
          is_active?: boolean
          meeting_id: string
          meeting_url: string
          participant_key?: string | null
          provider: string
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          class_id?: string
          created_at?: string
          expires_at?: string | null
          host_key?: string | null
          id?: string
          is_active?: boolean
          meeting_id?: string
          meeting_url?: string
          participant_key?: string | null
          provider?: string
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_credentials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "live_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      network_nodes: {
        Row: {
          allowed_domains: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          node_type: string
          priority: number
          timeout_ms: number
          updated_at: string
          url: string
        }
        Insert: {
          allowed_domains?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          node_type?: string
          priority?: number
          timeout_ms?: number
          updated_at?: string
          url: string
        }
        Update: {
          allowed_domains?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          node_type?: string
          priority?: number
          timeout_ms?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean
          created_at: string
          step_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          step_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          step_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          asset_id: string
          created_at: string | null
          expires_at: string | null
          filled_quantity: number | null
          id: string
          order_type: Database["public"]["Enums"]["order_type"]
          price: number | null
          quantity: number
          remaining_quantity: number | null
          side: Database["public"]["Enums"]["order_side"]
          status: Database["public"]["Enums"]["order_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          expires_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_type: Database["public"]["Enums"]["order_type"]
          price?: number | null
          quantity: number
          remaining_quantity?: number | null
          side: Database["public"]["Enums"]["order_side"]
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          expires_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          price?: number | null
          quantity?: number
          remaining_quantity?: number | null
          side?: Database["public"]["Enums"]["order_side"]
          status?: Database["public"]["Enums"]["order_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "tokenized_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "user_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          compliance_risk: Database["public"]["Enums"]["compliance_risk"] | null
          created_at: string | null
          device_fingerprint: string | null
          email: string
          first_name: string | null
          id: string
          ip_whitelist: string[] | null
          jurisdiction: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          kyc_submitted_at: string | null
          last_login_at: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          two_factor_enabled: boolean | null
          two_factor_secret_encrypted: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          compliance_risk?:
            | Database["public"]["Enums"]["compliance_risk"]
            | null
          created_at?: string | null
          device_fingerprint?: string | null
          email: string
          first_name?: string | null
          id?: string
          ip_whitelist?: string[] | null
          jurisdiction?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          kyc_submitted_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          two_factor_enabled?: boolean | null
          two_factor_secret_encrypted?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          compliance_risk?:
            | Database["public"]["Enums"]["compliance_risk"]
            | null
          created_at?: string | null
          device_fingerprint?: string | null
          email?: string
          first_name?: string | null
          id?: string
          ip_whitelist?: string[] | null
          jurisdiction?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          kyc_submitted_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          two_factor_enabled?: boolean | null
          two_factor_secret_encrypted?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          identifier: string
          request_count: number
          updated_at: string | null
          window_start: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          identifier: string
          request_count?: number
          updated_at?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          identifier?: string
          request_count?: number
          updated_at?: string | null
          window_start?: string
        }
        Relationships: []
      }
      regulatory_reports: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          jurisdiction: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          jurisdiction: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          jurisdiction?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Relationships: []
      }
      sacred_law_principles: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_prerequisite: boolean
          prerequisite_for: Json
          principle_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_prerequisite?: boolean
          prerequisite_for?: Json
          principle_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_prerequisite?: boolean
          prerequisite_for?: Json
          principle_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          is_blocked: boolean | null
          location_data: Json | null
          risk_score: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          is_blocked?: boolean | null
          location_data?: Json | null
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          is_blocked?: boolean | null
          location_data?: Json | null
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          attendee_id: string
          created_at: string | null
          duration_minutes: number | null
          engagement_score: number | null
          id: string
          joined_at: string | null
          left_at: string | null
          session_id: string
        }
        Insert: {
          attendee_id: string
          created_at?: string | null
          duration_minutes?: number | null
          engagement_score?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id: string
        }
        Update: {
          attendee_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          engagement_score?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      smart_contract_functions: {
        Row: {
          compliance_rules: Json | null
          contract_type: string
          created_at: string
          deployment_status: string | null
          function_name: string
          gas_estimates: Json | null
          id: string
          parameters: Json
          updated_at: string
          version: string | null
          xrpl_transaction_type: string | null
        }
        Insert: {
          compliance_rules?: Json | null
          contract_type: string
          created_at?: string
          deployment_status?: string | null
          function_name: string
          gas_estimates?: Json | null
          id?: string
          parameters?: Json
          updated_at?: string
          version?: string | null
          xrpl_transaction_type?: string | null
        }
        Update: {
          compliance_rules?: Json | null
          contract_type?: string
          created_at?: string
          deployment_status?: string | null
          function_name?: string
          gas_estimates?: Json | null
          id?: string
          parameters?: Json
          updated_at?: string
          version?: string | null
          xrpl_transaction_type?: string | null
        }
        Relationships: []
      }
      strategy_signals: {
        Row: {
          asset_id: string
          confidence: number | null
          created_at: string | null
          executed: boolean | null
          id: string
          price_target: number | null
          risk_assessment: Json | null
          signal_type: string
          strategy_id: string
        }
        Insert: {
          asset_id: string
          confidence?: number | null
          created_at?: string | null
          executed?: boolean | null
          id?: string
          price_target?: number | null
          risk_assessment?: Json | null
          signal_type: string
          strategy_id: string
        }
        Update: {
          asset_id?: string
          confidence?: number | null
          created_at?: string | null
          executed?: boolean | null
          id?: string
          price_target?: number | null
          risk_assessment?: Json | null
          signal_type?: string
          strategy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "tokenized_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "trading_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_events: {
        Row: {
          created_at: string
          error: string | null
          id: string
          progress: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          progress?: number
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          progress?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tokenization_events: {
        Row: {
          amount: number
          asset_issuer: string | null
          asset_symbol: string
          compliance_metadata: Json | null
          created_at: string | null
          event_type: string
          id: string
          iso20022_data: Json | null
          user_id: string
          xrpl_ledger_index: number | null
          xrpl_transaction_hash: string | null
        }
        Insert: {
          amount: number
          asset_issuer?: string | null
          asset_symbol: string
          compliance_metadata?: Json | null
          created_at?: string | null
          event_type: string
          id?: string
          iso20022_data?: Json | null
          user_id: string
          xrpl_ledger_index?: number | null
          xrpl_transaction_hash?: string | null
        }
        Update: {
          amount?: number
          asset_issuer?: string | null
          asset_symbol?: string
          compliance_metadata?: Json | null
          created_at?: string | null
          event_type?: string
          id?: string
          iso20022_data?: Json | null
          user_id?: string
          xrpl_ledger_index?: number | null
          xrpl_transaction_hash?: string | null
        }
        Relationships: []
      }
      tokenized_assets: {
        Row: {
          asset_name: string
          asset_symbol: string
          circulating_supply: number | null
          compliance_data: Json | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          total_supply: number
          updated_at: string | null
          xrpl_currency_code: string | null
          xrpl_issuer_address: string | null
        }
        Insert: {
          asset_name: string
          asset_symbol: string
          circulating_supply?: number | null
          compliance_data?: Json | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          total_supply: number
          updated_at?: string | null
          xrpl_currency_code?: string | null
          xrpl_issuer_address?: string | null
        }
        Update: {
          asset_name?: string
          asset_symbol?: string
          circulating_supply?: number | null
          compliance_data?: Json | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          total_supply?: number
          updated_at?: string | null
          xrpl_currency_code?: string | null
          xrpl_issuer_address?: string | null
        }
        Relationships: []
      }
      trade_executions: {
        Row: {
          asset_symbol: string
          buyer_id: string
          compliance_flags: string[] | null
          created_at: string | null
          execution_time: string | null
          id: string
          order_id: string | null
          price: number
          quantity: number
          seller_id: string
          settlement_status: string | null
          total_value: number
          xrpl_transaction_hash: string | null
        }
        Insert: {
          asset_symbol: string
          buyer_id: string
          compliance_flags?: string[] | null
          created_at?: string | null
          execution_time?: string | null
          id?: string
          order_id?: string | null
          price: number
          quantity: number
          seller_id: string
          settlement_status?: string | null
          total_value: number
          xrpl_transaction_hash?: string | null
        }
        Update: {
          asset_symbol?: string
          buyer_id?: string
          compliance_flags?: string[] | null
          created_at?: string | null
          execution_time?: string | null
          id?: string
          order_id?: string | null
          price?: number
          quantity?: number
          seller_id?: string
          settlement_status?: string | null
          total_value?: number
          xrpl_transaction_hash?: string | null
        }
        Relationships: []
      }
      trading_strategies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          parameters: Json
          performance_metrics: Json | null
          strategy_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parameters: Json
          performance_metrics?: Json | null
          strategy_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parameters?: Json
          performance_metrics?: Json | null
          strategy_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          assignment_id: string | null
          awarded_at: string
          badge_name: string
          badge_type: string
          course_id: string | null
          description: string | null
          icon_url: string | null
          id: string
          lesson_id: string | null
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          awarded_at?: string
          badge_name: string
          badge_type?: string
          course_id?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          lesson_id?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          awarded_at?: string
          badge_name?: string
          badge_type?: string
          course_id?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          lesson_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_behavior_log: {
        Row: {
          action: string
          created_at: string | null
          device_fingerprint: string | null
          id: string
          ip_address: unknown | null
          location_data: Json | null
          risk_indicators: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          risk_indicators?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          risk_indicators?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          certificate_url: string | null
          certification_id: string
          code_display_count: number | null
          earned_at: string | null
          expires_at: string | null
          id: string
          last_displayed_at: string | null
          user_id: string
          verification_code: string | null
          verification_code_hash: string | null
        }
        Insert: {
          certificate_url?: string | null
          certification_id: string
          code_display_count?: number | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          last_displayed_at?: string | null
          user_id: string
          verification_code?: string | null
          verification_code_hash?: string | null
        }
        Update: {
          certificate_url?: string | null
          certification_id?: string
          code_display_count?: number | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          last_displayed_at?: string | null
          user_id?: string
          verification_code?: string | null
          verification_code_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser_info: Json | null
          device_fingerprint: string
          device_name: string | null
          first_seen: string
          id: string
          is_trusted: boolean | null
          last_seen: string
          location_data: Json | null
          user_id: string
        }
        Insert: {
          browser_info?: Json | null
          device_fingerprint: string
          device_name?: string | null
          first_seen?: string
          id?: string
          is_trusted?: boolean | null
          last_seen?: string
          location_data?: Json | null
          user_id: string
        }
        Update: {
          browser_info?: Json | null
          device_fingerprint?: string
          device_name?: string | null
          first_seen?: string
          id?: string
          is_trusted?: boolean | null
          last_seen?: string
          location_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_read: boolean | null
          message_type: string | null
          parent_message_id: string | null
          recipient_id: string
          sender_id: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          recipient_id: string
          sender_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_read?: boolean | null
          message_type?: string | null
          parent_message_id?: string | null
          recipient_id?: string
          sender_id?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "user_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa: {
        Row: {
          backup_codes: string[]
          created_at: string
          enabled: boolean
          totp_secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[]
          created_at?: string
          enabled?: boolean
          totp_secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[]
          created_at?: string
          enabled?: boolean
          totp_secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_posts: {
        Row: {
          comment_count: number | null
          content: string
          created_at: string | null
          id: string
          is_public: boolean | null
          like_count: number | null
          media_urls: string[] | null
          post_type: string | null
          share_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          share_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          post_type?: string | null
          share_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          follower_count: number | null
          following_count: number | null
          id: string
          is_public: boolean | null
          location: string | null
          notification_settings: Json | null
          phone: string | null
          post_count: number | null
          privacy_settings: Json | null
          profile_banner_url: string | null
          social_links: Json | null
          theme_preferences: Json | null
          updated_at: string | null
          user_id: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          notification_settings?: Json | null
          phone?: string | null
          post_count?: number | null
          privacy_settings?: Json | null
          profile_banner_url?: string | null
          social_links?: Json | null
          theme_preferences?: Json | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          notification_settings?: Json | null
          phone?: string | null
          post_count?: number | null
          privacy_settings?: Json | null
          profile_banner_url?: string | null
          social_links?: Json | null
          theme_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          current_level: number | null
          experience_points: number | null
          id: string
          last_updated: string | null
          skill_id: string
          user_id: string
        }
        Insert: {
          current_level?: number | null
          experience_points?: number | null
          id?: string
          last_updated?: string | null
          skill_id: string
          user_id: string
        }
        Update: {
          current_level?: number | null
          experience_points?: number | null
          id?: string
          last_updated?: string | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_automation_rules: {
        Row: {
          actions: Json
          created_at: string
          execution_count: number
          id: string
          is_active: boolean
          last_executed_at: string | null
          rule_name: string
          rule_type: string
          trigger_conditions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          rule_name: string
          rule_type: string
          trigger_conditions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          created_at?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          rule_name?: string
          rule_type?: string
          trigger_conditions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      XRPL: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      xrpl_config: {
        Row: {
          cold_wallet_address: string | null
          compliance_settings: Json | null
          created_at: string
          hot_wallet_seed: string | null
          id: string
          issuer_address: string | null
          kyc_requirements: Json | null
          minting_policies: Json | null
          network_type: string
          regulatory_framework: Json | null
          updated_at: string
        }
        Insert: {
          cold_wallet_address?: string | null
          compliance_settings?: Json | null
          created_at?: string
          hot_wallet_seed?: string | null
          id?: string
          issuer_address?: string | null
          kyc_requirements?: Json | null
          minting_policies?: Json | null
          network_type?: string
          regulatory_framework?: Json | null
          updated_at?: string
        }
        Update: {
          cold_wallet_address?: string | null
          compliance_settings?: Json | null
          created_at?: string
          hot_wallet_seed?: string | null
          id?: string
          issuer_address?: string | null
          kyc_requirements?: Json | null
          minting_policies?: Json | null
          network_type?: string
          regulatory_framework?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: {
        Args: { user_email: string }
        Returns: boolean
      }
      audit_sensitive_data_access: {
        Args: {
          p_accessed_user_id?: string
          p_operation?: string
          p_table_name: string
        }
        Returns: undefined
      }
      can_access_kyc_data: {
        Args: { kyc_user_id: string }
        Returns: boolean
      }
      cleanup_expired_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_stuck_executions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_agent_api_key: {
        Args: { p_agent_id: string; p_key_text: string; p_name?: string }
        Returns: string
      }
      create_notification: {
        Args: {
          notification_data?: Json
          notification_message: string
          notification_title: string
          notification_type: string
          target_user_id: string
        }
        Returns: string
      }
      create_order_secure: {
        Args: {
          p_asset_id: string
          p_expires_at?: string
          p_order_type: string
          p_price?: number
          p_quantity: number
          p_side: string
          p_user_id: string
        }
        Returns: {
          error_message: string
          order_id: string
          success: boolean
        }[]
      }
      current_user_has_role: {
        Args: { required_role: string }
        Returns: boolean
      }
      execute_ai_agent_workflow: {
        Args: { agent_id: string; input_data?: Json; workflow_data?: Json }
        Returns: Json
      }
      generate_meeting_access_token: {
        Args: {
          p_attendee_id: string
          p_class_id: string
          p_expires_minutes?: number
        }
        Returns: string
      }
      generate_secure_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_public_user_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_user_notifications: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          data: Json
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }[]
      }
      get_user_profile_secure: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          follower_count: number
          following_count: number
          location: string
          post_count: number
          social_links: Json
          user_id: string
          username: string
          website: string
        }[]
      }
      get_user_subscription_with_stripe_customer: {
        Args: { p_user_id: string }
        Returns: {
          cancel_at_period_end: boolean
          current_period_end: string
          current_period_start: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          tier: string
        }[]
      }
      hash_api_key: {
        Args: { key_text: string }
        Returns: string
      }
      hash_verification_code: {
        Args: { code: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_oauth_account: {
        Args: {
          p_is_primary?: boolean
          p_provider: string
          p_provider_email?: string
          p_provider_id: string
          p_provider_metadata?: Json
        }
        Returns: string
      }
      log_validation_failure: {
        Args: {
          p_client_info?: Json
          p_details: Json
          p_failure_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      redeem_enrollment_link_atomic: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      register_device: {
        Args: {
          p_browser_info?: Json
          p_device_fingerprint: string
          p_device_name?: string
          p_location_data?: Json
        }
        Returns: string
      }
      revoke_agent_api_key: {
        Args: { p_key_id: string }
        Returns: boolean
      }
      set_admin_role_by_email: {
        Args: { target_email: string }
        Returns: boolean
      }
      update_api_key_usage: {
        Args: { p_key_hash: string }
        Returns: undefined
      }
      update_order_execution: {
        Args: {
          p_execution_price: number
          p_execution_quantity: number
          p_match_order_id: string
          p_order_id: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: { required_role: string; target_user_id: string }
        Returns: boolean
      }
      validate_meeting_access_token: {
        Args: { p_token: string }
        Returns: {
          attendee_id: string
          class_id: string
          is_valid: boolean
          meeting_url: string
        }[]
      }
      verify_api_key: {
        Args: { key_hash: string; key_text: string }
        Returns: boolean
      }
      verify_certification_code: {
        Args: { p_code: string; p_user_id?: string }
        Returns: {
          certification_name: string
          earned_at: string
          expires_at: string
          is_valid: boolean
          user_name: string
        }[]
      }
    }
    Enums: {
      compliance_risk: "low" | "medium" | "high" | "critical"
      kyc_status: "pending" | "approved" | "rejected" | "expired"
      order_side: "buy" | "sell"
      order_status: "pending" | "partial" | "filled" | "cancelled" | "expired"
      order_type: "market" | "limit" | "stop_loss" | "take_profit"
      subscription_tier: "free" | "standard" | "enterprise"
      user_role: "admin" | "premium" | "basic" | "compliance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      compliance_risk: ["low", "medium", "high", "critical"],
      kyc_status: ["pending", "approved", "rejected", "expired"],
      order_side: ["buy", "sell"],
      order_status: ["pending", "partial", "filled", "cancelled", "expired"],
      order_type: ["market", "limit", "stop_loss", "take_profit"],
      subscription_tier: ["free", "standard", "enterprise"],
      user_role: ["admin", "premium", "basic", "compliance"],
    },
  },
} as const
