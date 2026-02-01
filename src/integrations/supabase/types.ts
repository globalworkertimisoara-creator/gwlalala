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
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_agency_profile_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agency: { Args: { _user_id: string }; Returns: boolean }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
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
    },
  },
} as const
