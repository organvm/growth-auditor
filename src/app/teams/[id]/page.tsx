"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Loader from "@/components/Loader";
import type { TeamMemberRecord } from "@/lib/db";

export default function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${id}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load members. Are you a member of this team?");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setInviting(true);
    setError("");

    try {
      const res = await fetch(`/api/teams/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to invite member");
      }

      setNewMemberEmail("");
      fetchMembers();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <main className="main">
        <div className="card" style={{ textAlign: "center", padding: "5rem" }}>
          <Loader />
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="hero">
        <div className="astro-badge">
          <span aria-hidden="true">✦</span>
          Collective Alignment
        </div>
        <h1>Team Settings</h1>
        <p>Manage members and access levels for this collective.</p>
        <Link href="/teams" style={{ color: "var(--primary)", marginTop: "1rem", display: "inline-block" }}>
          ← Back to Teams
        </Link>
      </div>

      <div className="container" style={{ maxWidth: "800px" }}>
        {error && (
          <div className="card" style={{ borderColor: "var(--accent)", marginBottom: "2rem" }}>
            <p style={{ color: "var(--secondary)" }}>{error}</p>
          </div>
        )}

        <div className="card" style={{ marginBottom: "3rem" }}>
          <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Invite Member</h2>
          <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              className="input"
              type="email"
              required
              placeholder="colleague@example.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
            <div style={{ display: "flex", gap: "1rem" }}>
              <select
                className="input"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as "admin" | "member")}
                style={{ flex: 1 }}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn" type="submit" disabled={inviting} style={{ flex: 2, whiteSpace: "nowrap" }}>
                {inviting ? "Inviting..." : "Add"}
              </button>
            </div>
          </form>
        </div>

        <h2 style={{ marginBottom: "1.5rem" }}>Members</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {members.map((member) => (
            <div key={member.id} className="card" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: "#fff" }}>{member.email}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{member.role}</div>
              </div>
              {member.role === "owner" && (
                <div style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "var(--primary)", color: "#000", fontWeight: 700 }}>
                  OWNER
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
