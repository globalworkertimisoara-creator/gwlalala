import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, number> = {};

  try {
    // ── 1. Document / passport expiry alerts (30/14/7 days) ──
    let expiryAlerts = 0;
    for (const days of [30, 14, 7]) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const { data: expiring } = await supabase
        .from("candidates")
        .select("id, full_name, passport_expiry")
        .eq("passport_expiry", dateStr);

      if (expiring && expiring.length > 0) {
        const { data: staffUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "operations_manager", "documentation_lead", "documentation_staff"]);

        for (const candidate of expiring) {
          for (const staff of staffUsers || []) {
            await supabase.from("notifications").insert({
              user_id: staff.user_id,
              title: `Passport Expiry Alert (${days} days)`,
              message: `${candidate.full_name}'s passport expires on ${candidate.passport_expiry}`,
              type: "document_expiry",
              related_entity_type: "candidate",
              related_entity_id: candidate.id,
            });
            expiryAlerts++;
          }
        }
      }
    }
    results.expiry_alerts = expiryAlerts;

    // ── 2. Contract renewal reminders (60/30/7 days) ──
    let contractAlerts = 0;
    for (const days of [60, 30, 7]) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const { data: expiringContracts } = await supabase
        .from("contracts")
        .select("id, title, end_date")
        .eq("status", "active")
        .eq("end_date", dateStr);

      if (expiringContracts && expiringContracts.length > 0) {
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "sales_manager"]);

        for (const contract of expiringContracts) {
          for (const admin of admins || []) {
            await supabase.from("notifications").insert({
              user_id: admin.user_id,
              title: `Contract Expiring (${days} days)`,
              message: `"${contract.title}" expires on ${contract.end_date}`,
              type: "contract_renewal",
              related_entity_type: "contract",
              related_entity_id: contract.id,
            });
            contractAlerts++;
          }
        }
      }
    }
    results.contract_alerts = contractAlerts;

    // ── 3. Task deadline reminders (due in 24h) ──
    let taskAlerts = 0;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const { data: dueTasks } = await supabase
      .from("tasks")
      .select("id, title, assigned_to, due_date")
      .in("status", ["todo", "in_progress"])
      .gte("due_date", tomorrowStr + "T00:00:00")
      .lt("due_date", tomorrowStr + "T23:59:59");

    for (const task of dueTasks || []) {
      if (task.assigned_to) {
        await supabase.from("notifications").insert({
          user_id: task.assigned_to,
          title: "Task Due Tomorrow",
          message: `"${task.title}" is due tomorrow`,
          type: "task_deadline",
          related_entity_type: "task",
          related_entity_id: task.id,
        });
        taskAlerts++;
      }
    }
    results.task_alerts = taskAlerts;

    // ── 4. Overdue task alerts ──
    let overdueAlerts = 0;
    const now = new Date().toISOString();

    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select("id, title, assigned_to, due_date")
      .in("status", ["todo", "in_progress"])
      .lt("due_date", now);

    for (const task of overdueTasks || []) {
      if (task.assigned_to) {
        await supabase.from("notifications").insert({
          user_id: task.assigned_to,
          title: "Overdue Task",
          message: `"${task.title}" is overdue since ${new Date(task.due_date).toLocaleDateString()}`,
          type: "task_overdue",
          related_entity_type: "task",
          related_entity_id: task.id,
        });
        overdueAlerts++;
      }
    }
    results.overdue_alerts = overdueAlerts;

    // ── 5. Stalled workflow alerts (stuck > 14 days) ──
    let stallAlerts = 0;
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 14);

    const { data: stalledWorkflows } = await supabase
      .from("candidate_workflow")
      .select("id, candidate_id, current_phase, updated_at, candidate:candidates(full_name)")
      .lt("updated_at", staleDate.toISOString())
      .is("residence_permit_completed_at", null);

    if (stalledWorkflows && stalledWorkflows.length > 0) {
      const { data: ops } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "operations_manager", "project_manager"]);

      for (const wf of stalledWorkflows) {
        const candidateName = (wf.candidate as unknown as Record<string, unknown>)?.full_name || "Unknown";
        for (const op of ops || []) {
          await supabase.from("notifications").insert({
            user_id: op.user_id,
            title: "Stalled Workflow",
            message: `${candidateName} stuck in ${wf.current_phase} for 14+ days`,
            type: "workflow_stall",
            related_entity_type: "candidate",
            related_entity_id: wf.candidate_id,
          });
          stallAlerts++;
        }
      }
    }
    results.stall_alerts = stallAlerts;

    // ── 6. Manager daily digest: summary of all overdue team tasks ──
    let digestCount = 0;
    const allOverdue = overdueTasks || [];
    if (allOverdue.length > 0) {
      const { data: managers } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "operations_manager", "project_manager"]);

      const overdueList = allOverdue
        .slice(0, 10)
        .map((t: any) => `• "${t.title}"`)
        .join("\n");
      const extraCount = allOverdue.length > 10 ? `\n...and ${allOverdue.length - 10} more` : "";

      for (const mgr of managers || []) {
        await supabase.from("notifications").insert({
          user_id: mgr.user_id,
          title: `Daily Digest: ${allOverdue.length} Overdue Task${allOverdue.length > 1 ? "s" : ""}`,
          message: `${overdueList}${extraCount}`,
          type: "task_digest",
        });
        digestCount++;
      }
    }
    results.digest_notifications = digestCount;

    // ── 7. Auto-escalation: tasks overdue 3+ days ──
    let escalationCount = 0;
    const escalationThresholdDate = new Date();
    escalationThresholdDate.setDate(escalationThresholdDate.getDate() - 3);

    const { data: severelyOverdue } = await supabase
      .from("tasks")
      .select("id, title, assigned_to, assigned_role, due_date")
      .in("status", ["todo", "in_progress"])
      .lt("due_date", escalationThresholdDate.toISOString());

    for (const task of severelyOverdue || []) {
      // Check if already escalated for this task (avoid duplicates)
      const { data: existing } = await supabase
        .from("escalations")
        .select("id")
        .eq("title", `Overdue Task Escalation: ${task.title}`)
        .eq("is_auto_escalated", true)
        .in("status", ["open", "acknowledged"])
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Create escalation record
      const { error: escError } = await supabase.from("escalations").insert({
        title: `Overdue Task Escalation: ${task.title}`,
        description: `Task "${task.title}" has been overdue since ${new Date(task.due_date).toLocaleDateString()}. Assigned to: ${task.assigned_role || "unspecified role"}.`,
        priority: "high",
        is_auto_escalated: true,
        auto_escalation_reason: `Task overdue for 3+ days (due: ${task.due_date})`,
        escalated_to_role: "operations_manager",
        status: "open",
      });

      if (!escError) {
        // Notify operations managers
        const { data: opsManagers } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "operations_manager"]);

        for (const mgr of opsManagers || []) {
          await supabase.from("notifications").insert({
            user_id: mgr.user_id,
            title: "Task Auto-Escalated",
            message: `"${task.title}" has been overdue for 3+ days and was auto-escalated`,
            type: "task_escalation",
            related_entity_type: "task",
            related_entity_id: task.id,
          });
        }
        escalationCount++;
      }
    }
    results.auto_escalations = escalationCount;

    console.log("Daily checks completed:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Daily checks error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
