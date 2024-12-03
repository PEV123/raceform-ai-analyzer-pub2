export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          anthropic_model: string
          created_at: string
          id: string
          knowledge_base: string
          openai_model: string
          race_title_template: string
          selected_provider: string
          site_name: string
          system_prompt: string
          timezone: string
          updated_at: string
        }
        Insert: {
          anthropic_model?: string
          created_at?: string
          id?: string
          knowledge_base?: string
          openai_model?: string
          race_title_template?: string
          selected_provider?: string
          site_name?: string
          system_prompt?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          anthropic_model?: string
          created_at?: string
          id?: string
          knowledge_base?: string
          openai_model?: string
          race_title_template?: string
          selected_provider?: string
          site_name?: string
          system_prompt?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      horse_distance_analysis: {
        Row: {
          created_at: string | null
          dam: string | null
          dam_id: string | null
          damsire: string | null
          damsire_id: string | null
          horse: string
          horse_id: string
          id: string
          sire: string | null
          sire_id: string | null
          total_runs: number | null
        }
        Insert: {
          created_at?: string | null
          dam?: string | null
          dam_id?: string | null
          damsire?: string | null
          damsire_id?: string | null
          horse: string
          horse_id: string
          id?: string
          sire?: string | null
          sire_id?: string | null
          total_runs?: number | null
        }
        Update: {
          created_at?: string | null
          dam?: string | null
          dam_id?: string | null
          damsire?: string | null
          damsire_id?: string | null
          horse?: string
          horse_id?: string
          id?: string
          sire?: string | null
          sire_id?: string | null
          total_runs?: number | null
        }
        Relationships: []
      }
      horse_distance_details: {
        Row: {
          ae_index: number | null
          analysis_id: string | null
          dist: string
          dist_f: string | null
          dist_m: string | null
          dist_y: string | null
          fourth_places: number | null
          id: string
          place_index: number | null
          runs: number | null
          second_places: number | null
          third_places: number | null
          win_percentage: number | null
          wins: number | null
        }
        Insert: {
          ae_index?: number | null
          analysis_id?: string | null
          dist: string
          dist_f?: string | null
          dist_m?: string | null
          dist_y?: string | null
          fourth_places?: number | null
          id?: string
          place_index?: number | null
          runs?: number | null
          second_places?: number | null
          third_places?: number | null
          win_percentage?: number | null
          wins?: number | null
        }
        Update: {
          ae_index?: number | null
          analysis_id?: string | null
          dist?: string
          dist_f?: string | null
          dist_m?: string | null
          dist_y?: string | null
          fourth_places?: number | null
          id?: string
          place_index?: number | null
          runs?: number | null
          second_places?: number | null
          third_places?: number | null
          win_percentage?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "horse_distance_details_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "horse_distance_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      horse_distance_times: {
        Row: {
          course: string | null
          date: string
          distance_detail_id: string | null
          going: string | null
          id: string
          position: string | null
          region: string | null
          time: string | null
        }
        Insert: {
          course?: string | null
          date: string
          distance_detail_id?: string | null
          going?: string | null
          id?: string
          position?: string | null
          region?: string | null
          time?: string | null
        }
        Update: {
          course?: string | null
          date?: string
          distance_detail_id?: string | null
          going?: string | null
          id?: string
          position?: string | null
          region?: string | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horse_distance_times_distance_detail_id_fkey"
            columns: ["distance_detail_id"]
            isOneToOne: false
            referencedRelation: "horse_distance_details"
            referencedColumns: ["id"]
          },
        ]
      }
      horse_results: {
        Row: {
          class: string | null
          comment: string | null
          course: string
          created_at: string | null
          date: string
          distance: string | null
          going: string | null
          horse_id: string
          id: string
          position: string | null
          race_id: string | null
          second: string | null
          second_btn: string | null
          second_weight_lbs: number | null
          third: string | null
          third_btn: string | null
          third_weight_lbs: number | null
          weight_lbs: number | null
          winner: string | null
          winner_btn: string | null
          winner_weight_lbs: number | null
        }
        Insert: {
          class?: string | null
          comment?: string | null
          course: string
          created_at?: string | null
          date: string
          distance?: string | null
          going?: string | null
          horse_id: string
          id?: string
          position?: string | null
          race_id?: string | null
          second?: string | null
          second_btn?: string | null
          second_weight_lbs?: number | null
          third?: string | null
          third_btn?: string | null
          third_weight_lbs?: number | null
          weight_lbs?: number | null
          winner?: string | null
          winner_btn?: string | null
          winner_weight_lbs?: number | null
        }
        Update: {
          class?: string | null
          comment?: string | null
          course?: string
          created_at?: string | null
          date?: string
          distance?: string | null
          going?: string | null
          horse_id?: string
          id?: string
          position?: string | null
          race_id?: string | null
          second?: string | null
          second_btn?: string | null
          second_weight_lbs?: number | null
          third?: string | null
          third_btn?: string | null
          third_weight_lbs?: number | null
          weight_lbs?: number | null
          winner?: string | null
          winner_btn?: string | null
          winner_weight_lbs?: number | null
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string
          date: string
          error: string | null
          id: string
          progress: number
          status: string
          summary: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          error?: string | null
          id?: string
          progress?: number
          status?: string
          summary?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          error?: string | null
          id?: string
          progress?: number
          status?: string
          summary?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      membership_level_permissions: {
        Row: {
          created_at: string
          membership_level_id: string
          permission_id: string
        }
        Insert: {
          created_at?: string
          membership_level_id: string
          permission_id: string
        }
        Update: {
          created_at?: string
          membership_level_id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_level_permissions_membership_level_id_fkey"
            columns: ["membership_level_id"]
            isOneToOne: false
            referencedRelation: "membership_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_level_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      odds_history: {
        Row: {
          created_at: string
          id: string
          odds: Json
          runner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          odds: Json
          runner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          odds?: Json
          runner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "odds_history_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          resource_path: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          resource_path: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          resource_path?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_login: string | null
          membership_level: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          last_login?: string | null
          membership_level?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_login?: string | null
          membership_level?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      race_chats: {
        Row: {
          created_at: string
          id: string
          message: string
          race_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          race_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          race_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_race"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_chats_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_documents: {
        Row: {
          content_type: string
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          race_id: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          race_id: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_documents_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_results: {
        Row: {
          age_band: string | null
          api_race_id: string | null
          class: string | null
          comments: string | null
          course: string | null
          course_id: string | null
          created_at: string | null
          date: string | null
          dist: string | null
          dist_f: string | null
          dist_m: string | null
          dist_y: string | null
          going: string | null
          id: string
          jumps: string | null
          non_runners: string | null
          off_dt: string | null
          off_time: string | null
          pattern: string | null
          race_id: string | null
          race_name: string | null
          rating_band: string | null
          region: string | null
          sex_rest: string | null
          tote_csf: string | null
          tote_ex: string | null
          tote_pl: string | null
          tote_tricast: string | null
          tote_trifecta: string | null
          tote_win: string | null
          type: string | null
          updated_at: string | null
          winning_time_detail: string | null
        }
        Insert: {
          age_band?: string | null
          api_race_id?: string | null
          class?: string | null
          comments?: string | null
          course?: string | null
          course_id?: string | null
          created_at?: string | null
          date?: string | null
          dist?: string | null
          dist_f?: string | null
          dist_m?: string | null
          dist_y?: string | null
          going?: string | null
          id?: string
          jumps?: string | null
          non_runners?: string | null
          off_dt?: string | null
          off_time?: string | null
          pattern?: string | null
          race_id?: string | null
          race_name?: string | null
          rating_band?: string | null
          region?: string | null
          sex_rest?: string | null
          tote_csf?: string | null
          tote_ex?: string | null
          tote_pl?: string | null
          tote_tricast?: string | null
          tote_trifecta?: string | null
          tote_win?: string | null
          type?: string | null
          updated_at?: string | null
          winning_time_detail?: string | null
        }
        Update: {
          age_band?: string | null
          api_race_id?: string | null
          class?: string | null
          comments?: string | null
          course?: string | null
          course_id?: string | null
          created_at?: string | null
          date?: string | null
          dist?: string | null
          dist_f?: string | null
          dist_m?: string | null
          dist_y?: string | null
          going?: string | null
          id?: string
          jumps?: string | null
          non_runners?: string | null
          off_dt?: string | null
          off_time?: string | null
          pattern?: string | null
          race_id?: string | null
          race_name?: string | null
          rating_band?: string | null
          region?: string | null
          sex_rest?: string | null
          tote_csf?: string | null
          tote_ex?: string | null
          tote_pl?: string | null
          tote_tricast?: string | null
          tote_trifecta?: string | null
          tote_win?: string | null
          type?: string | null
          updated_at?: string | null
          winning_time_detail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          age_band: string
          big_race: boolean | null
          course: string
          course_id: string | null
          created_at: string | null
          distance: string | null
          distance_f: string | null
          distance_round: string | null
          field_size: number
          going: string | null
          going_detailed: string | null
          id: string
          is_abandoned: boolean | null
          jumps: string | null
          off_time: string
          pattern: string | null
          prize: string
          race_class: string
          race_id: string | null
          race_name: string
          rail_movements: string | null
          rating_band: string
          region: string
          stalls: string | null
          surface: string | null
          type: string | null
          weather: string | null
        }
        Insert: {
          age_band: string
          big_race?: boolean | null
          course: string
          course_id?: string | null
          created_at?: string | null
          distance?: string | null
          distance_f?: string | null
          distance_round?: string | null
          field_size: number
          going?: string | null
          going_detailed?: string | null
          id?: string
          is_abandoned?: boolean | null
          jumps?: string | null
          off_time: string
          pattern?: string | null
          prize: string
          race_class: string
          race_id?: string | null
          race_name: string
          rail_movements?: string | null
          rating_band: string
          region: string
          stalls?: string | null
          surface?: string | null
          type?: string | null
          weather?: string | null
        }
        Update: {
          age_band?: string
          big_race?: boolean | null
          course?: string
          course_id?: string | null
          created_at?: string | null
          distance?: string | null
          distance_f?: string | null
          distance_round?: string | null
          field_size?: number
          going?: string | null
          going_detailed?: string | null
          id?: string
          is_abandoned?: boolean | null
          jumps?: string | null
          off_time?: string
          pattern?: string | null
          prize?: string
          race_class?: string
          race_id?: string | null
          race_name?: string
          rail_movements?: string | null
          rating_band?: string
          region?: string
          stalls?: string | null
          surface?: string | null
          type?: string | null
          weather?: string | null
        }
        Relationships: []
      }
      runner_results: {
        Row: {
          age: string | null
          btn: string | null
          comment: string | null
          created_at: string | null
          dam: string | null
          dam_id: string | null
          damsire: string | null
          damsire_id: string | null
          draw: string | null
          headgear: string | null
          horse: string | null
          horse_id: string | null
          id: string
          jockey: string | null
          jockey_claim_lbs: string | null
          jockey_id: string | null
          number: string | null
          or_rating: string | null
          ovr_btn: string | null
          owner: string | null
          owner_id: string | null
          position: string | null
          prize: string | null
          race_result_id: string | null
          rpr: string | null
          runner_id: string | null
          sex: string | null
          silk_url: string | null
          sire: string | null
          sire_id: string | null
          sp: string | null
          sp_dec: number | null
          time: string | null
          trainer: string | null
          trainer_id: string | null
          tsr: string | null
          weight: string | null
          weight_lbs: number | null
        }
        Insert: {
          age?: string | null
          btn?: string | null
          comment?: string | null
          created_at?: string | null
          dam?: string | null
          dam_id?: string | null
          damsire?: string | null
          damsire_id?: string | null
          draw?: string | null
          headgear?: string | null
          horse?: string | null
          horse_id?: string | null
          id?: string
          jockey?: string | null
          jockey_claim_lbs?: string | null
          jockey_id?: string | null
          number?: string | null
          or_rating?: string | null
          ovr_btn?: string | null
          owner?: string | null
          owner_id?: string | null
          position?: string | null
          prize?: string | null
          race_result_id?: string | null
          rpr?: string | null
          runner_id?: string | null
          sex?: string | null
          silk_url?: string | null
          sire?: string | null
          sire_id?: string | null
          sp?: string | null
          sp_dec?: number | null
          time?: string | null
          trainer?: string | null
          trainer_id?: string | null
          tsr?: string | null
          weight?: string | null
          weight_lbs?: number | null
        }
        Update: {
          age?: string | null
          btn?: string | null
          comment?: string | null
          created_at?: string | null
          dam?: string | null
          dam_id?: string | null
          damsire?: string | null
          damsire_id?: string | null
          draw?: string | null
          headgear?: string | null
          horse?: string | null
          horse_id?: string | null
          id?: string
          jockey?: string | null
          jockey_claim_lbs?: string | null
          jockey_id?: string | null
          number?: string | null
          or_rating?: string | null
          ovr_btn?: string | null
          owner?: string | null
          owner_id?: string | null
          position?: string | null
          prize?: string | null
          race_result_id?: string | null
          rpr?: string | null
          runner_id?: string | null
          sex?: string | null
          silk_url?: string | null
          sire?: string | null
          sire_id?: string | null
          sp?: string | null
          sp_dec?: number | null
          time?: string | null
          trainer?: string | null
          trainer_id?: string | null
          tsr?: string | null
          weight?: string | null
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "runner_results_race_result_id_fkey"
            columns: ["race_result_id"]
            isOneToOne: false
            referencedRelation: "race_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runner_results_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      runners: {
        Row: {
          age: string | null
          breeder: string | null
          colour: string | null
          comment: string | null
          created_at: string | null
          dam: string
          dam_id: string | null
          dam_region: string
          damsire: string | null
          damsire_id: string | null
          damsire_region: string | null
          dob: string | null
          draw: number
          form: string | null
          headgear: string | null
          headgear_run: string | null
          horse: string
          horse_id: string
          id: string
          is_non_runner: boolean | null
          jockey: string
          jockey_id: string | null
          last_run: string | null
          lbs: number
          medical: Json | null
          number: number
          odds: Json | null
          ofr: string | null
          owner: string | null
          owner_id: string | null
          past_results_flags: Json | null
          prev_owners: Json | null
          prev_trainers: Json | null
          quotes: Json | null
          race_id: string | null
          region: string | null
          rpr: string | null
          sex: string | null
          sex_code: string | null
          silk_url: string | null
          sire: string
          sire_region: string
          spotlight: string | null
          stable_tour: Json | null
          trainer: string
          trainer_14_days: Json | null
          trainer_id: string | null
          trainer_location: string | null
          trainer_rtf: string | null
          ts: string | null
          wind_surgery: string | null
          wind_surgery_run: string | null
        }
        Insert: {
          age?: string | null
          breeder?: string | null
          colour?: string | null
          comment?: string | null
          created_at?: string | null
          dam: string
          dam_id?: string | null
          dam_region: string
          damsire?: string | null
          damsire_id?: string | null
          damsire_region?: string | null
          dob?: string | null
          draw: number
          form?: string | null
          headgear?: string | null
          headgear_run?: string | null
          horse: string
          horse_id: string
          id?: string
          is_non_runner?: boolean | null
          jockey: string
          jockey_id?: string | null
          last_run?: string | null
          lbs: number
          medical?: Json | null
          number: number
          odds?: Json | null
          ofr?: string | null
          owner?: string | null
          owner_id?: string | null
          past_results_flags?: Json | null
          prev_owners?: Json | null
          prev_trainers?: Json | null
          quotes?: Json | null
          race_id?: string | null
          region?: string | null
          rpr?: string | null
          sex?: string | null
          sex_code?: string | null
          silk_url?: string | null
          sire: string
          sire_region: string
          spotlight?: string | null
          stable_tour?: Json | null
          trainer: string
          trainer_14_days?: Json | null
          trainer_id?: string | null
          trainer_location?: string | null
          trainer_rtf?: string | null
          ts?: string | null
          wind_surgery?: string | null
          wind_surgery_run?: string | null
        }
        Update: {
          age?: string | null
          breeder?: string | null
          colour?: string | null
          comment?: string | null
          created_at?: string | null
          dam?: string
          dam_id?: string | null
          dam_region?: string
          damsire?: string | null
          damsire_id?: string | null
          damsire_region?: string | null
          dob?: string | null
          draw?: number
          form?: string | null
          headgear?: string | null
          headgear_run?: string | null
          horse?: string
          horse_id?: string
          id?: string
          is_non_runner?: boolean | null
          jockey?: string
          jockey_id?: string | null
          last_run?: string | null
          lbs?: number
          medical?: Json | null
          number?: number
          odds?: Json | null
          ofr?: string | null
          owner?: string | null
          owner_id?: string | null
          past_results_flags?: Json | null
          prev_owners?: Json | null
          prev_trainers?: Json | null
          quotes?: Json | null
          race_id?: string | null
          region?: string | null
          rpr?: string | null
          sex?: string | null
          sex_code?: string | null
          silk_url?: string | null
          sire?: string
          sire_region?: string
          spotlight?: string | null
          stable_tour?: Json | null
          trainer?: string
          trainer_14_days?: Json | null
          trainer_id?: string | null
          trainer_location?: string | null
          trainer_rtf?: string | null
          ts?: string | null
          wind_surgery?: string | null
          wind_surgery_run?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "runners_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      script_settings: {
        Row: {
          content: string
          created_at: string
          id: string
          is_enabled: boolean | null
          location: string
          name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          location: string
          name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          location?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          keywords: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          page_path: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_path: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_path?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string
          details: Json | null
          id: string
          page_path: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          details?: Json | null
          id?: string
          page_path?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          page_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      move_race_to_historical: {
        Args: {
          p_race_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
