import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReportRequest {
  report_type: string;
  filters?: Record<string, unknown>;
  format?: "csv";
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          const s = v === null || v === undefined ? "" : String(v);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check user is internal staff
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role === "agency" || roleData.role === "employer") {
      throw new Error("Insufficient permissions");
    }

    const { report_type, filters } = (await req.json()) as ReportRequest;
    let rows: Record<string, unknown>[] = [];

    switch (report_type) {
      case "candidate_pipeline": {
        const { data } = await supabase
          .from("candidates")
          .select("full_name, email, phone, nationality, current_country, current_stage, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(5000);
        rows = (data || []).map((c: Record<string, unknown>) => ({
          ...c,
          days_in_stage: Math.floor(
            (Date.now() - new Date(c.updated_at as string).getTime()) / 86400000
          ),
        }));
        break;
      }

      case "agency_performance": {
        const { data } = await supabase
          .from("agency_profiles")
          .select("company_name, country, contact_person, email, worker_capacity, years_in_business");
        
        // Get worker counts per agency
        const { data: workers } = await supabase
          .from("agency_workers")
          .select("agency_id, current_stage");

        const agencyStats: Record<string, { total: number; placed: number }> = {};
        (workers || []).forEach((w: Record<string, unknown>) => {
          const aid = w.agency_id as string;
          if (!agencyStats[aid]) agencyStats[aid] = { total: 0, placed: 0 };
          agencyStats[aid].total++;
          if (w.current_stage === "placed") agencyStats[aid].placed++;
        });

        rows = (data || []).map((a: Record<string, unknown>) => {
          const stats = agencyStats[(a as { id?: string }).id || ""] || { total: 0, placed: 0 };
          return {
            company_name: a.company_name,
            country: a.country,
            contact_person: a.contact_person,
            email: a.email,
            total_submissions: stats.total,
            placements: stats.placed,
            success_rate: stats.total > 0 ? `${((stats.placed / stats.total) * 100).toFixed(1)}%` : "0%",
          };
        });
        break;
      }

      case "project_status": {
        const { data } = await supabase
          .from("projects")
          .select("name, status, country, positions_count, created_at");

        const { data: workflows } = await supabase
          .from("candidate_workflow")
          .select("project_id, current_phase, residence_permit_completed_at");

        const projectStats: Record<string, { total: number; completed: number }> = {};
        (workflows || []).forEach((w: Record<string, unknown>) => {
          const pid = w.project_id as string;
          if (!projectStats[pid]) projectStats[pid] = { total: 0, completed: 0 };
          projectStats[pid].total++;
          if (w.residence_permit_completed_at) projectStats[pid].completed++;
        });

        rows = (data || []).map((p: Record<string, unknown>) => {
          const stats = projectStats[(p as { id?: string }).id || ""] || { total: 0, completed: 0 };
          return {
            name: p.name,
            status: p.status,
            country: p.country,
            positions: p.positions_count,
            candidates_in_pipeline: stats.total,
            completed: stats.completed,
            fill_rate: (p.positions_count as number) > 0
              ? `${((stats.completed / (p.positions_count as number)) * 100).toFixed(1)}%`
              : "N/A",
            created_at: p.created_at,
          };
        });
        break;
      }

      case "compliance": {
        const { data } = await supabase
          .from("candidates")
          .select("full_name, email, nationality, passport_expiry, passport_number")
          .not("passport_expiry", "is", null)
          .order("passport_expiry", { ascending: true })
          .limit(5000);

        rows = (data || []).map((c: Record<string, unknown>) => {
          const expiry = new Date(c.passport_expiry as string);
          const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / 86400000);
          return {
            full_name: c.full_name,
            email: c.email,
            nationality: c.nationality,
            passport_number: c.passport_number,
            passport_expiry: c.passport_expiry,
            days_until_expiry: daysUntilExpiry,
            status: daysUntilExpiry < 0 ? "EXPIRED" : daysUntilExpiry < 30 ? "CRITICAL" : daysUntilExpiry < 90 ? "WARNING" : "OK",
          };
        });
        break;
      }

      case "billing_summary": {
        const { data } = await supabase
          .from("billing_records")
          .select(`
            total_amount, currency, status, created_at,
            agency:agency_profiles(company_name),
            candidate:candidates(full_name)
          `)
          .order("created_at", { ascending: false })
          .limit(5000);

        rows = (data || []).map((b: Record<string, unknown>) => ({
          agency: (b.agency as Record<string, unknown>)?.company_name || "N/A",
          candidate: (b.candidate as Record<string, unknown>)?.full_name || "N/A",
          amount: b.total_amount,
          currency: b.currency,
          status: b.status,
          created_at: b.created_at,
        }));
        break;
      }

      default:
        throw new Error(`Unknown report type: ${report_type}`);
    }

    const csv = toCsv(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${report_type}_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Report generation error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
