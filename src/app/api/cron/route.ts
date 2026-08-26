import { NextResponse } from "next/server";
import { saveAudit, getScheduledAudits, updateScheduledAudit, getSubscription, getTeamMembers } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { orchestrateCosmicAudit } from "@/services/aiOrchestrator";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_placeholder");

function getEmailFrom(): string {
  return `${getConfig("appName") || "Avditor Mvndi"} <${getConfig("emailFrom") || "hello@growthauditor.ai"}>`;
}

function getBaseUrl(): string {
  return getConfig("baseUrl") || "http://localhost:3000";
}

async function generateMonthlyAudit(
  link: string,
  businessType: string,
  goals: string,
  userEmail: string,
  teamId?: string
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY; // allow-secret
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set for monthly audit");
    return;
  }

  const sub = await getSubscription(userEmail);
  const isPro = sub?.plan === "pro" && sub?.status === "active";

  // Use the submerged orchestrator for consistency and quality
  const result = await orchestrateCosmicAudit({
    link,
    businessType,
    goals,
    provider: "gemini",
    auth: apiKey,
    isPro,
  });

  const auditId = crypto.randomUUID();
  await saveAudit({
    id: auditId,
    userEmail,
    teamId,
    link,
    businessType,
    goals,
    markdownAudit: result.markdownAudit,
    scores: JSON.stringify(result.scores || {}),
  });

  // Notify recipients
  const recipients = [userEmail];
  if (teamId) {
    const members = await getTeamMembers(teamId);
    members.forEach(m => {
      if (!recipients.includes(m.email)) recipients.push(m.email);
    });
  }

  if (resend) {
    const scores = result.scores || {};
    try {
      await resend.emails.send({
        from: getEmailFrom(),
        to: recipients,
        subject: "Your Cosmic Alignment Has Evolved ✦",
        html: `
          <h1>Growth Strategy Updated</h1>
          <p>The cosmic cycle has completed. We've generated a new audit for <strong>${link}</strong>.</p>
          <div style="background: #0a0a1a; color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Current Alignment Scores:</strong></p>
            <ul>
              <li>Mercury (Communication): ${scores.communication}/100</li>
              <li>Venus (Aesthetic): ${scores.aesthetic}/100</li>
              <li>Mars (Drive): ${scores.drive}/100</li>
              <li>Saturn (Structure): ${scores.structure}/100</li>
            </ul>
          </div>
          <p><a href="${getBaseUrl()}/history">View full evolution in your archive.</a></p>
          <p>Stay cosmic,</p>
          <p>The Avditor Mvndi Team</p>
        `,
      });
    } catch (e) {
      console.error("Failed to send cron emails:", e);
    }
  }
}

function isDue(frequency: "weekly" | "monthly", lastRunAt?: string): boolean {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  const now = Date.now();
  const daysSinceLast = (now - last) / (1000 * 60 * 60 * 24);
  return frequency === "weekly" ? daysSinceLast >= 7 : daysSinceLast >= 30;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
    }

    const expectedSecret = `Bearer ${cronSecret}`;

    if (authHeader !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let processed = 0;
    const schedules = await getScheduledAudits();
    const enabledSchedules = schedules.filter((s) => s.enabled);

    if (enabledSchedules.length > 0) {
      for (const schedule of enabledSchedules) {
        if (!isDue(schedule.frequency, schedule.lastRunAt)) continue;

        try {
          await generateMonthlyAudit(
            schedule.link,
            schedule.businessType,
            schedule.goals,
            schedule.userEmail,
            schedule.teamId
          );
          await updateScheduledAudit(schedule.id, { lastRunAt: new Date().toISOString() });
          processed++;
        } catch (e) {
          console.error(`Failed scheduled audit ${schedule.id}:`, e);
        }
      }
      return NextResponse.json({ success: true, processedSchedules: processed });
    }

    return NextResponse.json({ success: true, processedSchedules: processed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
