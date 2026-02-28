"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

interface ServiceRequest {
  id: string;
  name: string;
  email: string;
  company: string | null;
  serviceType: string;
  description: string;
  budget: string | null;
  status: string;
  createdAt: string;
}

export default function AdminServicesPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => setRequests(data.requests || []));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setRequests(
        requests.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] gradient-text mb-8">
        Service Requests
      </h1>

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">{req.name}</h3>
                <p className="text-text-secondary text-sm">{req.email}</p>
                {req.company && (
                  <p className="text-text-muted text-xs">{req.company}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={req.status}
                  onChange={(e) => updateStatus(req.id, e.target.value)}
                  className="px-3 py-1 bg-navy/50 border border-glass-border rounded-lg text-sm text-text-primary focus:border-gold/50 focus:outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3 text-xs text-text-muted">
              <span className="px-2 py-0.5 rounded bg-gold/10 text-gold">
                {req.serviceType}
              </span>
              {req.budget && <span>Budget: {req.budget}</span>}
              <span>{formatDate(req.createdAt)}</span>
            </div>
            <p className="text-text-secondary text-sm">{req.description}</p>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-center py-12 text-text-secondary">
            No service requests yet.
          </p>
        )}
      </div>
    </div>
  );
}
