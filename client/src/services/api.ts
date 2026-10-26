import { FullIncident, Incident, ReliabilityOverview } from '../types';

const API_BASE = '/api';

export async function fetchIncidents(params?: {
  status?: string;
  severity?: string;
  service?: string;
  search?: string;
}): Promise<Incident[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.severity && params.severity !== 'ALL') query.set('severity', params.severity);
  if (params?.service && params.service !== 'ALL') query.set('service', params.service);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load incidents');
  const json = await res.json();
  return json.data || [];
}

export async function fetchIncidentById(id: string): Promise<FullIncident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error(`Failed to load incident ${id}`);
  const json = await res.json();
  return json.data;
}

export async function createIncident(payload: any): Promise<{ data: Incident; severityAnalysis: any }> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to create incident');
  }
  return res.json();
}

export async function updateIncident(id: string, payload: any): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || 'Failed to update incident');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteIncident(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete incident');
}

export async function addTimelineEvent(incidentId: string, payload: any) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add timeline event');
  return res.json();
}

export async function deleteTimelineEvent(incidentId: string, eventId: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/timeline/${eventId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete timeline event');
}

export async function addOrUpdateRootCause(incidentId: string, payload: any) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/root-cause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update root cause level');
  return res.json();
}

export async function deleteRootCause(incidentId: string, causeId: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/root-cause/${causeId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete root cause level');
}

export async function addActionItem(incidentId: string, payload: any) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/action-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create action item');
  return res.json();
}

export async function updateActionItem(incidentId: string, itemId: string, payload: any) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/action-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update action item');
  return res.json();
}

export async function deleteActionItem(incidentId: string, itemId: string) {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/action-items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete action item');
}

export async function fetchAnalytics(): Promise<ReliabilityOverview> {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  const json = await res.json();
  return json.data;
}

export async function seedDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo data');
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
}
