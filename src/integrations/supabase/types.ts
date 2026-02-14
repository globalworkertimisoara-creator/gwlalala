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
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
            foreignKeyName: "agency_job_invitations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
            foreignKeyName: "agency_workers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
        ]
      }
      candidates: {
        Row: {
          added_by: string | null
          created_at: string
          current_country: string | null
          current_stage: Database["public"]["Enums"]["recruitment_stage"]
          email: string
          expected_start_date: string | null
          full_name: string
          id: string
          linkedin: string | null
          nationality: string | null
          parents_names: string | null
          passport_expiry: string | null
          passport_issue_date: string | null
          passport_issued_by: string | null
          passport_number: string | null
          phone: string | null
          rejection_reason: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          current_country?: string | null
          current_stage?: Database["public"]["Enums"]["recruitment_stage"]
          email: string
          expected_start_date?: string | null
          full_name: string
          id?: string
          linkedin?: string | null
          nationality?: string | null
          parents_names?: string | null
          passport_expiry?: string | null
          passport_issue_date?: string | null
          passport_issued_by?: string | null
          passport_number?: string | null
          phone?: string | null
          rejection_reason?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          current_country?: string | null
          current_stage?: Database["public"]["Enums"]["recruitment_stage"]
          email?: string
          expected_start_date?: string | null
          full_name?: string
          id?: string
          linkedin?: string | null
          nationality?: string | null
          parents_names?: string | null
          passport_expiry?: string | null
          passport_issue_date?: string | null
          passport_issued_by?: string | null
          passport_number?: string | null
          phone?: string | null
          rejection_reason?: string | null
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
            foreignKeyName: "escalations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        ]
      }
      projects: {
        Row: {
          contract_signed_at: string | null
          countries_in_contract: string[]
          created_at: string
          created_by: string | null
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
          contract_signed_at?: string | null
          countries_in_contract?: string[]
          created_at?: string
          created_by?: string | null
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
          contract_signed_at?: string | null
          countries_in_contract?: string[]
          created_at?: string
          created_by?: string | null
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
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
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
      get_agency_profile_id: { Args: { _user_id: string }; Returns: string }
      get_agency_profiles_limited: {
        Args: never
        Returns: {
          company_name: string
          country: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agency: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_to_job: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      is_assigned_to_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
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
      app_role:
        | "admin"
        | "recruiter"
        | "agency"
        | "documentation_staff"
        | "operations_manager"
        | "documentation_lead"
        | "sales_manager"
        | "project_manager"
      approval_status:
        | "pending_review"
        | "approved"
        | "rejected"
        | "needs_documents"
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
      escalation_status:
        | "open"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "closed"
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
      app_role: [
        "admin",
        "recruiter",
        "agency",
        "documentation_staff",
        "operations_manager",
        "documentation_lead",
        "sales_manager",
        "project_manager",
      ],
      approval_status: [
        "pending_review",
        "approved",
        "rejected",
        "needs_documents",
      ],
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
      escalation_status: [
        "open",
        "acknowledged",
        "in_progress",
        "resolved",
        "closed",
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
