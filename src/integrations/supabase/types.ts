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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          job_id: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          project_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_activity_log: {
        Row: {
          action: string
          agency_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
          user_name: string | null
          user_role: Database["public"]["Enums"]["agency_team_role"] | null
        }
        Insert: {
          action: string
          agency_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id: string
          user_name?: string | null
          user_role?: Database["public"]["Enums"]["agency_team_role"] | null
        }
        Update: {
          action?: string
          agency_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
          user_name?: string | null
          user_role?: Database["public"]["Enums"]["agency_team_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_job_invitations: {
        Row: {
          agency_id: string
          id: string
          invited_at: string
          invited_by: string | null
          job_id: string
        }
        Insert: {
          agency_id: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          job_id: string
        }
        Update: {
          agency_id?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_job_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_job_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_job_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_job_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_job_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_profiles: {
        Row: {
          address: string | null
          certifications: string | null
          company_name: string
          contact_person: string
          countries_recruiting_from: string | null
          country: string
          created_at: string
          email: string
          has_testing_facilities: boolean | null
          id: string
          industries_focus: string | null
          office_locations: string | null
          phone: string | null
          recruitment_license: string | null
          specializations: string | null
          testing_facilities_locations: string | null
          updated_at: string
          user_id: string
          worker_capacity: number | null
          years_in_business: number | null
        }
        Insert: {
          address?: string | null
          certifications?: string | null
          company_name: string
          contact_person: string
          countries_recruiting_from?: string | null
          country: string
          created_at?: string
          email: string
          has_testing_facilities?: boolean | null
          id?: string
          industries_focus?: string | null
          office_locations?: string | null
          phone?: string | null
          recruitment_license?: string | null
          specializations?: string | null
          testing_facilities_locations?: string | null
          updated_at?: string
          user_id: string
          worker_capacity?: number | null
          years_in_business?: number | null
        }
        Update: {
          address?: string | null
          certifications?: string | null
          company_name?: string
          contact_person?: string
          countries_recruiting_from?: string | null
          country?: string
          created_at?: string
          email?: string
          has_testing_facilities?: boolean | null
          id?: string
          industries_focus?: string | null
          office_locations?: string | null
          phone?: string | null
          recruitment_license?: string | null
          specializations?: string | null
          testing_facilities_locations?: string | null
          updated_at?: string
          user_id?: string
          worker_capacity?: number | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      agency_team_invitations: {
        Row: {
          accepted_at: string | null
          agency_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_at: string | null
          invited_by: string
          invited_role: Database["public"]["Enums"]["agency_team_role"]
          status: string
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          agency_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by: string
          invited_role: Database["public"]["Enums"]["agency_team_role"]
          status?: string
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          agency_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string
          invited_role?: Database["public"]["Enums"]["agency_team_role"]
          status?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_team_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_team_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_team_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_worker_documents: {
        Row: {
          doc_type: Database["public"]["Enums"]["agency_doc_type"]
          file_name: string
          file_size: number | null
          id: string
          storage_path: string
          uploaded_at: string
          worker_id: string
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["agency_doc_type"]
          file_name: string
          file_size?: number | null
          id?: string
          storage_path: string
          uploaded_at?: string
          worker_id: string
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["agency_doc_type"]
          file_name?: string
          file_size?: number | null
          id?: string
          storage_path?: string
          uploaded_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_worker_documents_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "agency_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_workers: {
        Row: {
          agency_id: string
          approval_status: Database["public"]["Enums"]["approval_status"]
          current_country: string | null
          current_stage: Database["public"]["Enums"]["recruitment_stage"]
          date_of_birth: string | null
          email: string
          experience_years: number | null
          full_name: string
          id: string
          job_id: string
          nationality: string
          notes: string | null
          phone: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          current_country?: string | null
          current_stage?: Database["public"]["Enums"]["recruitment_stage"]
          date_of_birth?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          id?: string
          job_id: string
          nationality: string
          notes?: string | null
          phone?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          approval_status?: Database["public"]["Enums"]["approval_status"]
          current_country?: string | null
          current_stage?: Database["public"]["Enums"]["recruitment_stage"]
          date_of_birth?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          job_id?: string
          nationality?: string
          notes?: string | null
          phone?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_workers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_workers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_escalation_rules: {
        Row: {
          condition_field: string
          condition_value: string | null
          created_at: string
          created_by: string | null
          days_threshold: number
          description: string | null
          entity_type: string
          escalate_to_role: Database["public"]["Enums"]["app_role"]
          id: string
          is_active: boolean
          name: string
          priority: string
          updated_at: string
        }
        Insert: {
          condition_field: string
          condition_value?: string | null
          created_at?: string
          created_by?: string | null
          days_threshold?: number
          description?: string | null
          entity_type: string
          escalate_to_role: Database["public"]["Enums"]["app_role"]
          id?: string
          is_active?: boolean
          name: string
          priority?: string
          updated_at?: string
        }
        Update: {
          condition_field?: string
          condition_value?: string | null
          created_at?: string
          created_by?: string | null
          days_threshold?: number
          description?: string | null
          entity_type?: string
          escalate_to_role?: Database["public"]["Enums"]["app_role"]
          id?: string
          is_active?: boolean
          name?: string
          priority?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_change_log: {
        Row: {
          action: string
          billing_payment_id: string | null
          billing_record_id: string
          changed_by: string
          changed_by_name: string | null
          changed_by_role: string | null
          created_at: string
          field_changed: string | null
          id: string
          new_value: string | null
          note: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          billing_payment_id?: string | null
          billing_record_id: string
          changed_by: string
          changed_by_name?: string | null
          changed_by_role?: string | null
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          billing_payment_id?: string | null
          billing_record_id?: string
          changed_by?: string
          changed_by_name?: string | null
          changed_by_role?: string | null
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_change_log_billing_payment_id_fkey"
            columns: ["billing_payment_id"]
            isOneToOne: false
            referencedRelation: "billing_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_change_log_billing_record_id_fkey"
            columns: ["billing_record_id"]
            isOneToOne: false
            referencedRelation: "billing_records"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_notes: {
        Row: {
          billing_record_id: string
          content: string
          created_at: string
          created_by: string
          created_by_name: string | null
          created_by_role: string | null
          id: string
        }
        Insert: {
          billing_record_id: string
          content: string
          created_at?: string
          created_by: string
          created_by_name?: string | null
          created_by_role?: string | null
          id?: string
        }
        Update: {
          billing_record_id?: string
          content?: string
          created_at?: string
          created_by?: string
          created_by_name?: string | null
          created_by_role?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_notes_billing_record_id_fkey"
            columns: ["billing_record_id"]
            isOneToOne: false
            referencedRelation: "billing_records"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount: number
          billing_record_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          percentage: number
          reference_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          billing_record_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          percentage: number
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_record_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          percentage?: number
          reference_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_billing_record_id_fkey"
            columns: ["billing_record_id"]
            isOneToOne: false
            referencedRelation: "billing_records"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_records: {
        Row: {
          agency_id: string
          agreed_at: string | null
          agreed_by_admin: string | null
          agreed_by_agency: string | null
          candidate_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          job_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          agreed_at?: string | null
          agreed_by_admin?: string | null
          agreed_by_agency?: string | null
          candidate_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          job_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          agreed_at?: string | null
          agreed_by_admin?: string | null
          agreed_by_agency?: string | null
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          job_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "billing_records_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_activity_log: {
        Row: {
          actor_id: string
          actor_type: string
          agency_id: string | null
          candidate_id: string
          company_id: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          is_shared_event: boolean
          summary: string
        }
        Insert: {
          actor_id: string
          actor_type: string
          agency_id?: string | null
          candidate_id: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          is_shared_event?: boolean
          summary: string
        }
        Update: {
          actor_id?: string
          actor_type?: string
          agency_id?: string | null
          candidate_id?: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          is_shared_event?: boolean
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "candidate_activity_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activity_log_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_education: {
        Row: {
          candidate_id: string
          created_at: string
          degree_obtained: string | null
          education_level: string
          field_of_study: string | null
          graduation_year: number | null
          id: string
          institution_name: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          degree_obtained?: string | null
          education_level: string
          field_of_study?: string | null
          graduation_year?: number | null
          id?: string
          institution_name?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          degree_obtained?: string | null
          education_level?: string
          field_of_study?: string | null
          graduation_year?: number | null
          id?: string
          institution_name?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_education_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_interviews: {
        Row: {
          candidate_id: string
          created_at: string | null
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_outcome: string | null
          interview_type: string
          interviewer_email: string | null
          interviewer_name: string | null
          location: string | null
          project_id: string
          scheduled_by: string | null
          scheduled_date: string
          status: string | null
          updated_at: string | null
          video_link: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_outcome?: string | null
          interview_type: string
          interviewer_email?: string | null
          interviewer_name?: string | null
          location?: string | null
          project_id: string
          scheduled_by?: string | null
          scheduled_date: string
          status?: string | null
          updated_at?: string | null
          video_link?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_outcome?: string | null
          interview_type?: string
          interviewer_email?: string | null
          interviewer_name?: string | null
          location?: string | null
          project_id?: string
          scheduled_by?: string | null
          scheduled_date?: string
          status?: string | null
          updated_at?: string | null
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_interviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_interviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "candidate_interviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_job_links: {
        Row: {
          candidate_id: string
          created_at: string
          current_status: Database["public"]["Enums"]["submission_status"]
          id: string
          job_id: string
          submitted_date: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["submission_status"]
          id?: string
          job_id: string
          submitted_date?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          current_status?: Database["public"]["Enums"]["submission_status"]
          id?: string
          job_id?: string
          submitted_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_job_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_languages: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          language_name: string
          proficiency_level: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          language_name: string
          proficiency_level?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          language_name?: string
          proficiency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_languages_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_offers: {
        Row: {
          benefits: string[] | null
          benefits_description: string | null
          candidate_id: string
          candidate_response: string | null
          candidate_response_at: string | null
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          offer_expires_at: string | null
          offer_letter_url: string | null
          position_title: string
          project_id: string
          salary_amount: number | null
          salary_currency: string | null
          salary_period: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: string[] | null
          benefits_description?: string | null
          candidate_id: string
          candidate_response?: string | null
          candidate_response_at?: string | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          offer_expires_at?: string | null
          offer_letter_url?: string | null
          position_title: string
          project_id: string
          salary_amount?: number | null
          salary_currency?: string | null
          salary_period?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: string[] | null
          benefits_description?: string | null
          candidate_id?: string
          candidate_response?: string | null
          candidate_response_at?: string | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          offer_expires_at?: string | null
          offer_letter_url?: string | null
          position_title?: string
          project_id?: string
          salary_amount?: number | null
          salary_currency?: string | null
          salary_period?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "candidate_offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_references: {
        Row: {
          candidate_id: string
          created_at: string
          email: string | null
          id: string
          phone: string | null
          position_title: string | null
          reference_name: string
          relationship: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          position_title?: string | null
          reference_name: string
          relationship?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          position_title?: string | null
          reference_name?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_references_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_skills: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          skill_name: string
          years_experience: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          skill_name: string
          years_experience?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          skill_name?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_work_experience: {
        Row: {
          candidate_id: string
          company_name: string | null
          country: string | null
          created_at: string
          end_date: string | null
          id: string
          job_description: string | null
          job_title: string
          sort_order: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          company_name?: string | null
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          job_description?: string | null
          job_title: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          company_name?: string | null
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          job_description?: string | null
          job_title?: string
          sort_order?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_work_experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_workflow: {
        Row: {
          arrival_completed_at: string | null
          candidate_id: string
          created_at: string
          current_phase: Database["public"]["Enums"]["workflow_phase"]
          documentation_completed_at: string | null
          id: string
          pipeline_stage: Database["public"]["Enums"]["recruitment_stage"]
          project_id: string
          recruitment_completed_at: string | null
          residence_permit_completed_at: string | null
          updated_at: string
          visa_completed_at: string | null
          workflow_type: Database["public"]["Enums"]["workflow_type"]
        }
        Insert: {
          arrival_completed_at?: string | null
          candidate_id: string
          created_at?: string
          current_phase?: Database["public"]["Enums"]["workflow_phase"]
          documentation_completed_at?: string | null
          id?: string
          pipeline_stage?: Database["public"]["Enums"]["recruitment_stage"]
          project_id: string
          recruitment_completed_at?: string | null
          residence_permit_completed_at?: string | null
          updated_at?: string
          visa_completed_at?: string | null
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
        }
        Update: {
          arrival_completed_at?: string | null
          candidate_id?: string
          created_at?: string
          current_phase?: Database["public"]["Enums"]["workflow_phase"]
          documentation_completed_at?: string | null
          id?: string
          pipeline_stage?: Database["public"]["Enums"]["recruitment_stage"]
          project_id?: string
          recruitment_completed_at?: string | null
          residence_permit_completed_at?: string | null
          updated_at?: string
          visa_completed_at?: string | null
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
        }
        Relationships: [
          {
            foreignKeyName: "candidate_workflow_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_workflow_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_workflow_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "candidate_workflow_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          added_by: string | null
          availability: Json | null
          created_at: string
          current_city: string | null
          current_country: string | null
          current_stage: Database["public"]["Enums"]["recruitment_stage"]
          date_of_birth: string | null
          driver_license: Json | null
          email: string | null
          expected_start_date: string | null
          family_info: Json | null
          full_name: string
          gender: string | null
          id: string
          internal_notes: Json | null
          job_preferences: Json | null
          linkedin: string | null
          marital_status: string | null
          national_id_number: string | null
          nationality: string | null
          number_of_children: number | null
          parents_names: string | null
          passport_expiry: string | null
          passport_issue_date: string | null
          passport_issued_by: string | null
          passport_number: string | null
          phone: string | null
          profile_photo_url: string | null
          rejection_reason: string | null
          salary_expectations: Json | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          added_by?: string | null
          availability?: Json | null
          created_at?: string
          current_city?: string | null
          current_country?: string | null
          current_stage?: Database["public"]["Enums"]["recruitment_stage"]
          date_of_birth?: string | null
          driver_license?: Json | null
          email?: string | null
          expected_start_date?: string | null
          family_info?: Json | null
          full_name: string
          gender?: string | null
          id?: string
          internal_notes?: Json | null
          job_preferences?: Json | null
          linkedin?: string | null
          marital_status?: string | null
          national_id_number?: string | null
          nationality?: string | null
          number_of_children?: number | null
          parents_names?: string | null
          passport_expiry?: string | null
          passport_issue_date?: string | null
          passport_issued_by?: string | null
          passport_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          rejection_reason?: string | null
          salary_expectations?: Json | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          added_by?: string | null
          availability?: Json | null
          created_at?: string
          current_city?: string | null
          current_country?: string | null
          current_stage?: Database["public"]["Enums"]["recruitment_stage"]
          date_of_birth?: string | null
          driver_license?: Json | null
          email?: string | null
          expected_start_date?: string | null
          family_info?: Json | null
          full_name?: string
          gender?: string | null
          id?: string
          internal_notes?: Json | null
          job_preferences?: Json | null
          linkedin?: string | null
          marital_status?: string | null
          national_id_number?: string | null
          nationality?: string | null
          number_of_children?: number | null
          parents_names?: string | null
          passport_expiry?: string | null
          passport_issue_date?: string | null
          passport_issued_by?: string | null
          passport_number?: string | null
          phone?: string | null
          profile_photo_url?: string | null
          rejection_reason?: string | null
          salary_expectations?: Json | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      client_activity_log: {
        Row: {
          action: string
          client_id: string
          created_at: string
          details: Json | null
          id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          created_at: string
          doc_type: string
          file_size: number | null
          id: string
          name: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          doc_type: string
          file_size?: number | null
          id?: string
          name: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          doc_type?: string
          file_size?: number | null
          id?: string
          name?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoices: {
        Row: {
          client_id: string
          contract_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          line_items: Json | null
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_contracts_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          project_id: string
          role: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          project_id: string
          role?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "client_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          assigned_to: string | null
          billing_address: string | null
          billing_email: string | null
          billing_name: string | null
          city: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          company_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          id_document_expiry: string | null
          id_document_number: string | null
          id_document_type: string | null
          last_name: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          source: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[] | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          assigned_to?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          city?: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          company_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_document_expiry?: string | null
          id_document_number?: string | null
          id_document_type?: string | null
          last_name?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          assigned_to?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          id_document_expiry?: string | null
          id_document_number?: string | null
          id_document_type?: string | null
          last_name?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          allow_multi_agency: boolean | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          company_name: string
          company_size: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          founded_year: number | null
          headquarters_address: string | null
          headquarters_city: string | null
          headquarters_country: string
          hr_contact_email: string | null
          hr_contact_name: string | null
          id: string
          industry: string | null
          legal_name: string | null
          linkedin_url: string | null
          postal_code: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string | null
          primary_contact_position: string | null
          registration_number: string | null
          require_background_checks: boolean | null
          status: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          allow_multi_agency?: boolean | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          company_name: string
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          headquarters_address?: string | null
          headquarters_city?: string | null
          headquarters_country: string
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          linkedin_url?: string | null
          postal_code?: string | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          registration_number?: string | null
          require_background_checks?: boolean | null
          status?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          allow_multi_agency?: boolean | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          company_name?: string
          company_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          headquarters_address?: string | null
          headquarters_city?: string | null
          headquarters_country?: string
          hr_contact_email?: string | null
          hr_contact_name?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          linkedin_url?: string | null
          postal_code?: string | null
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string | null
          primary_contact_position?: string | null
          registration_number?: string | null
          require_background_checks?: boolean | null
          status?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      company_projects: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "company_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_activity_log: {
        Row: {
          action: string
          actor_id: string
          contract_id: string
          created_at: string
          details: Json | null
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          summary: string
        }
        Insert: {
          action: string
          actor_id: string
          contract_id: string
          created_at?: string
          details?: Json | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          summary: string
        }
        Update: {
          action?: string
          actor_id?: string
          contract_id?: string
          created_at?: string
          details?: Json | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_activity_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_activity_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_contracts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_contracts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_number_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          contract_id: string
          id: string
          new_contract_date: string | null
          new_contract_number: string | null
          new_sequence_number: number | null
          old_contract_date: string | null
          old_contract_number: string | null
          old_sequence_number: number | null
          reason: string | null
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          contract_id: string
          id?: string
          new_contract_date?: string | null
          new_contract_number?: string | null
          new_sequence_number?: number | null
          old_contract_date?: string | null
          old_contract_number?: string | null
          old_sequence_number?: number | null
          reason?: string | null
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          contract_id?: string
          id?: string
          new_contract_date?: string | null
          new_contract_number?: string | null
          new_sequence_number?: number | null
          old_contract_date?: string | null
          old_contract_number?: string | null
          old_sequence_number?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_number_audit_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_number_audit_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_contracts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_sequences: {
        Row: {
          contract_prefix: string
          created_at: string
          id: string
          last_sequence_number: number
          updated_at: string
          year: number
        }
        Insert: {
          contract_prefix: string
          created_at?: string
          id?: string
          last_sequence_number?: number
          updated_at?: string
          year: number
        }
        Update: {
          contract_prefix?: string
          created_at?: string
          id?: string
          last_sequence_number?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      contract_template_versions: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          notes: string | null
          storage_path: string
          template_id: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          notes?: string | null
          storage_path: string
          template_id: string
          uploaded_by?: string | null
          version_number?: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          storage_path?: string
          template_id?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          auto_renew: boolean | null
          contract_date: string | null
          contract_number: string | null
          contract_prefix: string | null
          contract_type: string
          created_at: string
          created_by: string | null
          currency: string | null
          end_date: string | null
          id: string
          job_id: string | null
          notes: string | null
          number_modification_reason: string | null
          number_modified_at: string | null
          number_modified_by: string | null
          party_id: string
          party_type: string
          project_id: string | null
          renewal_date: string | null
          sales_person_id: string | null
          sequence_number: number | null
          signed_by_party_at: string | null
          signed_by_staff_at: string | null
          start_date: string | null
          status: string
          storage_path: string | null
          title: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          contract_date?: string | null
          contract_number?: string | null
          contract_prefix?: string | null
          contract_type: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          number_modification_reason?: string | null
          number_modified_at?: string | null
          number_modified_by?: string | null
          party_id: string
          party_type: string
          project_id?: string | null
          renewal_date?: string | null
          sales_person_id?: string | null
          sequence_number?: number | null
          signed_by_party_at?: string | null
          signed_by_staff_at?: string | null
          start_date?: string | null
          status?: string
          storage_path?: string | null
          title: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          contract_date?: string | null
          contract_number?: string | null
          contract_prefix?: string | null
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          number_modification_reason?: string | null
          number_modified_at?: string | null
          number_modified_by?: string | null
          party_id?: string
          party_type?: string
          project_id?: string | null
          renewal_date?: string | null
          sales_person_id?: string | null
          sequence_number?: number | null
          signed_by_party_at?: string | null
          signed_by_staff_at?: string | null
          start_date?: string | null
          status?: string
          storage_path?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string
          description: string | null
          document_name: string
          id: string
          is_required: boolean | null
          phase: Database["public"]["Enums"]["workflow_phase"]
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_name: string
          id?: string
          is_required?: boolean | null
          phase: Database["public"]["Enums"]["workflow_phase"]
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_name?: string
          id?: string
          is_required?: boolean | null
          phase?: Database["public"]["Enums"]["workflow_phase"]
          sort_order?: number | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          candidate_id: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_name: string
          id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          candidate_id: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_name: string
          id?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          candidate_id?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_name?: string
          id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_activity_log: {
        Row: {
          action: string
          company_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_candidate_audit_log: {
        Row: {
          action_type: string
          candidate_id: string
          company_id: string
          created_at: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          candidate_id: string
          company_id: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          candidate_id?: string
          company_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_candidate_audit_log_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_candidate_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_notes: {
        Row: {
          candidate_id: string
          company_id: string
          content: string
          created_at: string
          created_by: string
          id: string
        }
        Insert: {
          candidate_id: string
          company_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
        }
        Update: {
          candidate_id?: string
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_project_access: {
        Row: {
          can_approve_candidates: boolean | null
          can_make_offers: boolean | null
          can_schedule_interviews: boolean | null
          can_view_candidates: boolean | null
          granted_at: string | null
          granted_by: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          can_approve_candidates?: boolean | null
          can_make_offers?: boolean | null
          can_schedule_interviews?: boolean | null
          can_view_candidates?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          can_approve_candidates?: boolean | null
          can_make_offers?: boolean | null
          can_schedule_interviews?: boolean | null
          can_view_candidates?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "employer_project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          auto_escalation_reason: string | null
          candidate_id: string | null
          created_at: string
          description: string
          escalated_by: string | null
          escalated_to_role: Database["public"]["Enums"]["app_role"] | null
          escalated_to_user_id: string | null
          id: string
          is_auto_escalated: boolean
          job_id: string | null
          priority: string
          project_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["escalation_status"]
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_escalation_reason?: string | null
          candidate_id?: string | null
          created_at?: string
          description: string
          escalated_by?: string | null
          escalated_to_role?: Database["public"]["Enums"]["app_role"] | null
          escalated_to_user_id?: string | null
          id?: string
          is_auto_escalated?: boolean
          job_id?: string | null
          priority?: string
          project_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["escalation_status"]
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_escalation_reason?: string | null
          candidate_id?: string | null
          created_at?: string
          description?: string
          escalated_by?: string | null
          escalated_to_role?: Database["public"]["Enums"]["app_role"] | null
          escalated_to_user_id?: string | null
          id?: string
          is_auto_escalated?: boolean
          job_id?: string | null
          priority?: string
          project_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["escalation_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "escalations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          assigned_by: string | null
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          assigned_user_id: string | null
          created_at: string
          id: string
          job_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_user_id?: string | null
          created_at?: string
          id?: string
          job_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_user_id?: string | null
          created_at?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_job_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          client_company: string
          country: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string | null
          required_skills: string | null
          salary_range: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_company: string
          country: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          required_skills?: string | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_company?: string
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          required_skills?: string | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          candidate_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          candidate_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          candidate_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: boolean
          id: string
          in_app: boolean
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: boolean
          id?: string
          in_app?: boolean
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          project_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          team_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          project_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          team_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          project_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          team_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_team_role:
            | Database["public"]["Enums"]["agency_team_role"]
            | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          employer_team_role:
            | Database["public"]["Enums"]["employer_team_role"]
            | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_team_role?:
            | Database["public"]["Enums"]["agency_team_role"]
            | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          employer_team_role?:
            | Database["public"]["Enums"]["employer_team_role"]
            | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_team_role?:
            | Database["public"]["Enums"]["agency_team_role"]
            | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          employer_team_role?:
            | Database["public"]["Enums"]["employer_team_role"]
            | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          assigned_by: string | null
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          assigned_user_id: string | null
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_user_id?: string | null
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_user_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string | null
          contract_signed_at: string | null
          countries_in_contract: string[]
          created_at: string
          created_by: string | null
          default_workflow_type: string
          employer_name: string
          id: string
          location: string
          name: string
          notes: string | null
          sales_person_id: string | null
          sales_person_name: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          contract_signed_at?: string | null
          countries_in_contract?: string[]
          created_at?: string
          created_by?: string | null
          default_workflow_type?: string
          employer_name: string
          id?: string
          location: string
          name: string
          notes?: string | null
          sales_person_id?: string | null
          sales_person_name?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          contract_signed_at?: string | null
          countries_in_contract?: string[]
          created_at?: string
          created_by?: string | null
          default_workflow_type?: string
          employer_name?: string
          id?: string
          location?: string
          name?: string
          notes?: string | null
          sales_person_id?: string | null
          sales_person_name?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_codes: {
        Row: {
          code_type: string
          code_value: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code_type: string
          code_value: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code_type?: string
          code_value?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permissions: Json
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          permissions?: Json
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          permissions?: Json
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sales_commissions: {
        Row: {
          adjustment_reason: string | null
          commission_amount: number
          contract_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          original_amount: number | null
          project_id: string | null
          sales_person_id: string
          status: string
          updated_at: string
        }
        Insert: {
          adjustment_reason?: string | null
          commission_amount: number
          contract_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          original_amount?: number | null
          project_id?: string | null
          sales_person_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          adjustment_reason?: string | null
          commission_amount?: number
          contract_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          original_amount?: number | null
          project_id?: string | null
          sales_person_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_contracts_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "sales_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          filters: Json | null
          format: string
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          format?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          report_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          format?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stage_history: {
        Row: {
          candidate_id: string
          changed_at: string
          changed_by: string | null
          from_stage: Database["public"]["Enums"]["recruitment_stage"] | null
          id: string
          note: string | null
          to_stage: Database["public"]["Enums"]["recruitment_stage"]
        }
        Insert: {
          candidate_id: string
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["recruitment_stage"] | null
          id?: string
          note?: string | null
          to_stage: Database["public"]["Enums"]["recruitment_stage"]
        }
        Update: {
          candidate_id?: string
          changed_at?: string
          changed_by?: string | null
          from_stage?: Database["public"]["Enums"]["recruitment_stage"] | null
          id?: string
          note?: string | null
          to_stage?: Database["public"]["Enums"]["recruitment_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "stage_history_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_metadata: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          storage_backend: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_backend?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_backend?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          priority?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          is_lead: boolean
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_lead?: boolean
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_lead?: boolean
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_documents: {
        Row: {
          created_at: string
          document_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          phase: Database["public"]["Enums"]["workflow_phase"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          template_id: string | null
          updated_at: string
          uploaded_at: string | null
          uploaded_by: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          document_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          phase: Database["public"]["Enums"]["workflow_phase"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          template_id?: string | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          document_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          phase?: Database["public"]["Enums"]["workflow_phase"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          template_id?: string | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_documents_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "candidate_workflow"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_agency_own_candidates_by_country: {
        Row: {
          agency_id: string | null
          candidate_count: number | null
          country: string | null
          placed_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      v_agency_own_overview: {
        Row: {
          active_projects: number | null
          agency_id: string | null
          candidates_last_30_days: number | null
          completed_placements: number | null
          pending_documents: number | null
          stalled_workflows: number | null
          total_candidates: number | null
        }
        Relationships: []
      }
      v_agency_own_projects: {
        Row: {
          agency_id: string | null
          avg_days_to_placement: number | null
          candidates_placed: number | null
          candidates_submitted: number | null
          country: string | null
          placement_rate: number | null
          project_id: string | null
          project_name: string | null
          status: Database["public"]["Enums"]["project_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      v_agency_own_workflow_health: {
        Row: {
          agency_id: string | null
          avg_completion_days: number | null
          completed_count: number | null
          stalled_count: number | null
          total_workflows: number | null
          workflow_type: Database["public"]["Enums"]["workflow_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agency_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_overview"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_workers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "v_agency_performance"
            referencedColumns: ["id"]
          },
        ]
      }
      v_agency_performance: {
        Row: {
          agency_name: string | null
          id: string | null
          projects_involved: number | null
          success_rate: number | null
          successful_placements: number | null
          total_candidates_submitted: number | null
        }
        Relationships: []
      }
      v_client_analytics: {
        Row: {
          assigned_to: string | null
          client_type: Database["public"]["Enums"]["client_type"] | null
          contract_count: number | null
          created_at: string | null
          display_name: string | null
          id: string | null
          outstanding_amount: number | null
          project_count: number | null
          status: Database["public"]["Enums"]["client_status"] | null
          total_invoiced: number | null
          total_paid: number | null
        }
        Relationships: []
      }
      v_contracts_with_details: {
        Row: {
          auto_renew: boolean | null
          candidate_name: string | null
          client_name: string | null
          contract_date: string | null
          contract_number: string | null
          contract_prefix: string | null
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          end_date: string | null
          id: string | null
          job_id: string | null
          notes: string | null
          number_modification_reason: string | null
          number_modified_at: string | null
          number_modified_by: string | null
          party_id: string | null
          party_type: string | null
          project_id: string | null
          project_name: string | null
          renewal_date: string | null
          sales_person_id: string | null
          sales_person_name: string | null
          sequence_number: number | null
          signed_by_party_at: string | null
          signed_by_staff_at: string | null
          start_date: string | null
          status: string | null
          storage_path: string | null
          title: string | null
          total_value: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_document_statistics: {
        Row: {
          avg_review_hours: number | null
          document_count: number | null
          phase: Database["public"]["Enums"]["workflow_phase"] | null
          status: Database["public"]["Enums"]["document_status"] | null
        }
        Relationships: []
      }
      v_job_statistics: {
        Row: {
          client_company: string | null
          country: string | null
          days_open: number | null
          id: string | null
          interviewing_count: number | null
          placed_count: number | null
          status: string | null
          title: string | null
          total_applications: number | null
        }
        Relationships: []
      }
      v_jobs_by_country: {
        Row: {
          avg_days_open: number | null
          country: string | null
          job_count: number | null
          open_jobs: number | null
        }
        Relationships: []
      }
      v_jobs_by_status: {
        Row: {
          job_count: number | null
          status: string | null
        }
        Relationships: []
      }
      v_pipeline_phase_counts: {
        Row: {
          avg_days_in_pipeline: number | null
          candidate_count: number | null
          current_phase: Database["public"]["Enums"]["workflow_phase"] | null
          workflow_type: Database["public"]["Enums"]["workflow_type"] | null
        }
        Relationships: []
      }
      v_project_statistics: {
        Row: {
          agencies_involved: number | null
          avg_days_to_completion: number | null
          completed_candidates: number | null
          country: string | null
          employer_name: string | null
          fill_percentage: number | null
          id: string | null
          name: string | null
          start_date: string | null
          status: string | null
          total_candidates: number | null
        }
        Relationships: []
      }
      v_projects_by_country: {
        Row: {
          active_projects: number | null
          country: string | null
          project_count: number | null
        }
        Relationships: []
      }
      v_projects_by_status: {
        Row: {
          project_count: number | null
          status: string | null
        }
        Relationships: []
      }
      v_sales_commission_summary: {
        Row: {
          adjustment_reason: string | null
          commission_amount: number | null
          commission_status: string | null
          contract_id: string | null
          contract_status: string | null
          contract_title: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          currency: string | null
          employer_name: string | null
          id: string | null
          original_amount: number | null
          party_id: string | null
          party_type: string | null
          project_id: string | null
          project_name: string | null
          project_status: Database["public"]["Enums"]["project_status"] | null
          sales_person_id: string | null
          sales_person_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "v_contracts_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_agency_own_projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "sales_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_statistics"
            referencedColumns: ["id"]
          },
        ]
      }
      v_system_overview: {
        Row: {
          active_agencies: number | null
          active_projects: number | null
          candidates_last_30_days: number | null
          completed_workflows: number | null
          open_jobs: number | null
          pending_documents: number | null
          stalled_workflows: number | null
          total_candidates: number | null
        }
        Relationships: []
      }
      v_top_agencies: {
        Row: {
          agency_name: string | null
          success_rate: number | null
          successful_placements: number | null
        }
        Relationships: []
      }
      v_top_positions: {
        Row: {
          avg_applications_per_posting: number | null
          job_postings: number | null
          title: string | null
          total_applications: number | null
        }
        Relationships: []
      }
      v_workflow_completion: {
        Row: {
          avg_completion_days: number | null
          completed_count: number | null
          stalled_count: number | null
          total_workflows: number | null
          workflow_type: Database["public"]["Enums"]["workflow_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      agency_has_candidate_access: {
        Args: { _candidate_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_billing: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_assignments: { Args: { _user_id: string }; Returns: boolean }
      can_view_candidate_history: {
        Args: { _candidate_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_escalation: {
        Args: { _escalation_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_notification: {
        Args: { _notification_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_sales_commissions: {
        Args: { _user_id: string }
        Returns: boolean
      }
      employer_has_candidate_access: {
        Args: { _candidate_id: string; _user_id: string }
        Returns: boolean
      }
      get_agency_candidates_timeline: {
        Args: {
          p_agency_id: string
          p_end_date?: string
          p_interval?: string
          p_start_date?: string
        }
        Returns: {
          candidate_count: number
          period: string
        }[]
      }
      get_agency_own_metrics: {
        Args: { p_agency_id: string }
        Returns: {
          metric_name: string
          metric_unit: string
          metric_value: number
        }[]
      }
      get_agency_pipeline_funnel: {
        Args: {
          p_agency_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          count: number
          percentage: number
          phase: string
        }[]
      }
      get_agency_profile_id: { Args: { _user_id: string }; Returns: string }
      get_agency_profiles_limited: {
        Args: never
        Returns: {
          company_name: string
          country: string
          id: string
        }[]
      }
      get_agency_team_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["agency_team_role"]
      }
      get_candidates_timeline: {
        Args: {
          p_end_date?: string
          p_interval?: string
          p_start_date?: string
        }
        Returns: {
          candidate_count: number
          period: string
        }[]
      }
      get_contract_prefix: {
        Args: { p_contract_type: string }
        Returns: string
      }
      get_conversion_rates: {
        Args: never
        Returns: {
          conversion_rate: number
          from_phase: string
          to_phase: string
        }[]
      }
      get_employer_candidates: {
        Args: { p_project_id: string }
        Returns: {
          candidate_id: string
          current_country: string
          current_phase: string
          email: string
          full_name: string
          nationality: string
          phone: string
        }[]
      }
      get_employer_company_id: { Args: { _user_id: string }; Returns: string }
      get_employer_team_role_fn: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["employer_team_role"]
      }
      get_next_contract_number: {
        Args: { p_contract_date?: string; p_contract_prefix: string }
        Returns: {
          contract_date: string
          contract_number: string
          prefix: string
          sequence_number: number
        }[]
      }
      get_pipeline_funnel: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          count: number
          percentage: number
          phase: string
        }[]
      }
      get_project_metrics: {
        Args: { p_project_id: string }
        Returns: {
          metric_name: string
          metric_unit: string
          metric_value: number
        }[]
      }
      get_projects_timeline: {
        Args: {
          p_end_date?: string
          p_interval?: string
          p_start_date?: string
        }
        Returns: {
          period: string
          project_count: number
        }[]
      }
      has_employer_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agency: { Args: { _user_id: string }; Returns: boolean }
      is_agency_owner: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_to_job: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      is_assigned_to_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
      is_employer: { Args: { _user_id: string }; Returns: boolean }
      is_employer_admin: { Args: { _user_id: string }; Returns: boolean }
      owns_contract_file: {
        Args: { _object_name: string; _user_id: string }
        Returns: boolean
      }
      verify_registration_code: {
        Args: { _code_type: string; _code_value: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_action:
        | "created"
        | "updated"
        | "deleted"
        | "viewed"
        | "assigned"
        | "unassigned"
        | "status_changed"
        | "escalated"
        | "escalation_resolved"
        | "escalation_acknowledged"
        | "candidate_added"
        | "candidate_removed"
        | "stage_changed"
        | "document_uploaded"
        | "document_deleted"
        | "note_added"
        | "job_linked"
        | "job_unlinked"
      agency_doc_type:
        | "cv"
        | "passport"
        | "photo"
        | "working_video"
        | "presentation_video"
        | "trade_certificate"
        | "medical_clearance"
        | "training_doc"
        | "plane_ticket"
        | "visa_document"
        | "other"
      agency_team_role:
        | "agency_owner"
        | "agency_recruiter"
        | "agency_document_staff"
        | "agency_viewer"
      app_role:
        | "admin"
        | "recruiter"
        | "agency"
        | "documentation_staff"
        | "operations_manager"
        | "documentation_lead"
        | "sales_manager"
        | "project_manager"
        | "employer"
        | "sales_agent"
      approval_status:
        | "pending_review"
        | "approved"
        | "rejected"
        | "needs_documents"
      client_status: "lead" | "active" | "on_hold" | "inactive" | "churned"
      client_type: "company" | "individual"
      doc_type:
        | "resume"
        | "passport"
        | "visa"
        | "contract"
        | "other"
        | "residence_permit"
      document_status:
        | "pending"
        | "uploaded"
        | "under_review"
        | "approved"
        | "rejected"
      employer_team_role:
        | "employer_admin"
        | "employer_hr"
        | "employer_hiring_manager"
        | "employer_viewer"
      escalation_status:
        | "open"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "closed"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "partially_paid"
        | "overdue"
        | "cancelled"
        | "void"
      job_status: "open" | "closed" | "filled"
      project_status: "draft" | "active" | "on_hold" | "completed" | "cancelled"
      recruitment_stage:
        | "sourced"
        | "contacted"
        | "application_received"
        | "screening"
        | "shortlisted"
        | "submitted_to_client"
        | "client_feedback"
        | "interview_completed"
        | "offer_extended"
        | "offer_accepted"
        | "visa_processing"
        | "medical_checks"
        | "onboarding"
        | "placed"
        | "closed_not_placed"
      submission_status:
        | "submitted"
        | "interviewing"
        | "offered"
        | "placed"
        | "rejected"
      workflow_phase:
        | "recruitment"
        | "documentation"
        | "visa"
        | "arrival"
        | "residence_permit"
      workflow_type: "full_immigration" | "no_visa"
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
      activity_action: [
        "created",
        "updated",
        "deleted",
        "viewed",
        "assigned",
        "unassigned",
        "status_changed",
        "escalated",
        "escalation_resolved",
        "escalation_acknowledged",
        "candidate_added",
        "candidate_removed",
        "stage_changed",
        "document_uploaded",
        "document_deleted",
        "note_added",
        "job_linked",
        "job_unlinked",
      ],
      agency_doc_type: [
        "cv",
        "passport",
        "photo",
        "working_video",
        "presentation_video",
        "trade_certificate",
        "medical_clearance",
        "training_doc",
        "plane_ticket",
        "visa_document",
        "other",
      ],
      agency_team_role: [
        "agency_owner",
        "agency_recruiter",
        "agency_document_staff",
        "agency_viewer",
      ],
      app_role: [
        "admin",
        "recruiter",
        "agency",
        "documentation_staff",
        "operations_manager",
        "documentation_lead",
        "sales_manager",
        "project_manager",
        "employer",
        "sales_agent",
      ],
      approval_status: [
        "pending_review",
        "approved",
        "rejected",
        "needs_documents",
      ],
      client_status: ["lead", "active", "on_hold", "inactive", "churned"],
      client_type: ["company", "individual"],
      doc_type: [
        "resume",
        "passport",
        "visa",
        "contract",
        "other",
        "residence_permit",
      ],
      document_status: [
        "pending",
        "uploaded",
        "under_review",
        "approved",
        "rejected",
      ],
      employer_team_role: [
        "employer_admin",
        "employer_hr",
        "employer_hiring_manager",
        "employer_viewer",
      ],
      escalation_status: [
        "open",
        "acknowledged",
        "in_progress",
        "resolved",
        "closed",
      ],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partially_paid",
        "overdue",
        "cancelled",
        "void",
      ],
      job_status: ["open", "closed", "filled"],
      project_status: ["draft", "active", "on_hold", "completed", "cancelled"],
      recruitment_stage: [
        "sourced",
        "contacted",
        "application_received",
        "screening",
        "shortlisted",
        "submitted_to_client",
        "client_feedback",
        "interview_completed",
        "offer_extended",
        "offer_accepted",
        "visa_processing",
        "medical_checks",
        "onboarding",
        "placed",
        "closed_not_placed",
      ],
      submission_status: [
        "submitted",
        "interviewing",
        "offered",
        "placed",
        "rejected",
      ],
      workflow_phase: [
        "recruitment",
        "documentation",
        "visa",
        "arrival",
        "residence_permit",
      ],
      workflow_type: ["full_immigration", "no_visa"],
    },
  },
} as const
