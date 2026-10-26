import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { IncidentList } from './components/IncidentList';
import { IncidentDetail } from './components/IncidentDetail';
import { IncidentModal } from './components/IncidentModal';
import { AnalyticsView } from './components/AnalyticsView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { 
  fetchIncidents, 
  fetchIncidentById, 
  createIncident, 
  updateIncident, 
  deleteIncident,
  addTimelineEvent,
  deleteTimelineEvent,
  addOrUpdateRootCause,
  deleteRootCause,
  addActionItem,
  updateActionItem,
  deleteActionItem,
  fetchAnalytics,
  seedDemoData,
  resetDatabase
} from './services/api';
import { FullIncident, Incident, IncidentStatus, ReliabilityOverview } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<'incidents' | 'analytics'>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<FullIncident | null>(null);
  const [overview, setOverview] = useState<ReliabilityOverview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast dispatch helper
  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [incs, anlys] = await Promise.all([
        fetchIncidents(),
        fetchAnalytics(),
      ]);
      setIncidents(incs);
      setOverview(anlys);

      // If an incident was selected, reload its full details
      if (selectedIncident) {
        try {
          const fresh = await fetchIncidentById(selectedIncident.id);
          setSelectedIncident(fresh);
        } catch {
          setSelectedIncident(null);
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, [selectedIncident?.id]);

  useEffect(() => {
    loadData();
  }, []);

  // Handle selecting an incident
  const handleSelectIncident = async (id: string) => {
    setLoading(true);
    try {
      const full = await fetchIncidentById(id);
      setSelectedIncident(full);
      setCurrentTab('incidents');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast('error', err.message || 'Error loading incident details');
    } finally {
      setLoading(false);
    }
  };

  // Handle incident creation
  const handleCreateIncident = async (data: any) => {
    setLoading(true);
    try {
      const res = await createIncident(data);
      showToast('success', `Declared incident ${res.data.id} (${res.data.severity})`);
      setIsModalOpen(false);
      await loadData();
      await handleSelectIncident(res.data.id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to declare incident');
    } finally {
      setLoading(false);
    }
  };

  // Handle lifecycle status update
  const handleUpdateStatus = async (id: string, status: IncidentStatus) => {
    try {
      await updateIncident(id, { status });
      showToast('success', `Incident status updated to ${status}`);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  // Handle timeline operations
  const handleAddTimeline = async (incidentId: string, event: any) => {
    try {
      await addTimelineEvent(incidentId, event);
      showToast('success', 'Logged forensic timeline event');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add timeline event');
    }
  };

  const handleDeleteTimeline = async (incidentId: string, eventId: string) => {
    try {
      await deleteTimelineEvent(incidentId, eventId);
      showToast('info', 'Timeline event removed');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete timeline event');
    }
  };

  // Handle 5-whys operations
  const handleAddRootCause = async (incidentId: string, cause: any) => {
    try {
      await addOrUpdateRootCause(incidentId, cause);
      showToast('success', `Updated Why #${cause.whyLevel} root cause factor`);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update 5-whys');
    }
  };

  const handleDeleteRootCause = async (incidentId: string, causeId: string) => {
    try {
      await deleteRootCause(incidentId, causeId);
      showToast('info', 'Root cause level removed');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete root cause level');
    }
  };

  // Handle action item operations
  const handleAddActionItem = async (incidentId: string, item: any) => {
    try {
      await addActionItem(incidentId, item);
      showToast('success', 'Preventative action item assigned');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create action item');
    }
  };

  const handleUpdateActionItem = async (incidentId: string, itemId: string, update: any) => {
    try {
      await updateActionItem(incidentId, itemId, update);
      showToast('success', 'Action item updated');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update action item');
    }
  };

  const handleDeleteActionItem = async (incidentId: string, itemId: string) => {
    try {
      await deleteActionItem(incidentId, itemId);
      showToast('info', 'Action item deleted');
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete action item');
    }
  };

  // Handle deleting incident
  const handleDeleteIncident = async (id: string) => {
    try {
      await deleteIncident(id);
      showToast('info', `Incident ${id} deleted`);
      setSelectedIncident(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete incident');
    }
  };

  // Handle seeding demo data
  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedDemoData();
      showToast('success', 'Loaded 3 realistic SRE production incident scenarios!');
      await loadData();
      // Select the P1 scenario by default
      await handleSelectIncident('INC-20261026-001');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  // Handle resetting database
  const handleResetData = async () => {
    if (!confirm('Are you sure you want to clear all incidents from the database?')) return;
    setLoading(true);
    try {
      await resetDatabase();
      showToast('info', 'Database cleared.');
      setSelectedIncident(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reset database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Navigation & Status Bar */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'analytics') {
            setSelectedIncident(null);
          }
        }}
        onOpenCreateModal={() => setIsModalOpen(true)}
        onSeedData={handleSeedData}
        onResetData={handleResetData}
        overview={overview}
        loading={loading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        
        {currentTab === 'analytics' ? (
          <AnalyticsView overview={overview} loading={loading} />
        ) : (
          <div className="space-y-6">
            
            {/* If an incident is active, show the Post-Mortem Workbench */}
            {selectedIncident && (
              <IncidentDetail
                incident={selectedIncident}
                onClose={() => setSelectedIncident(null)}
                onUpdateStatus={handleUpdateStatus}
                onAddTimeline={handleAddTimeline}
                onDeleteTimeline={handleDeleteTimeline}
                onAddRootCause={handleAddRootCause}
                onDeleteRootCause={handleDeleteRootCause}
                onAddActionItem={handleAddActionItem}
                onUpdateActionItem={handleUpdateActionItem}
                onDeleteActionItem={handleDeleteActionItem}
                onDeleteIncident={handleDeleteIncident}
              />
            )}

            {/* Incidents Feed / Command Room */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Active Incident Registry</h2>
                  <p className="text-xs text-slate-400">All monitored outages, triage states, and SLA commitments</p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {incidents.length} Records
                </span>
              </div>

              <IncidentList
                incidents={incidents}
                selectedId={selectedIncident?.id || null}
                onSelectIncident={handleSelectIncident}
                loading={loading}
              />
            </div>

          </div>
        )}

      </main>

      {/* Declare Incident Modal */}
      <IncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateIncident}
        loading={loading}
      />

      {/* Toast Feedback System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ReliantOps &copy; 2026 - Site Reliability Engineering & Incident Command System</span>
          <span className="font-mono text-slate-600">Built with Node.js &bull; SQLite &bull; React &bull; Vite &bull; Tailwind CSS</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
