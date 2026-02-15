import { useState } from 'react';
import { MentorPanel } from './components/MentorPanel';
import { UndoPanel } from './components/UndoPanel';
import { DashboardPage } from './pages/DashboardPage';
import { EducationPage } from './pages/EducationPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ProjectionsPage } from './pages/ProjectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles.css';

type TabKey = 'dashboard' | 'payments' | 'projections' | 'settings' | 'education';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'payments', label: 'Payments' },
  { key: 'projections', label: 'Projections' },
  { key: 'settings', label: 'Settings' },
  { key: 'education', label: 'Education' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  return (
    <div className="app-shell">
      <header>
        <h1>Mente Milionária PJ – Financial Control System</h1>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'active-tab' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'payments' && <PaymentsPage />}
        {activeTab === 'projections' && <ProjectionsPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'education' && <EducationPage />}
      </main>

      <aside>
        <MentorPanel />
        <UndoPanel />
      </aside>
    </div>
  );
}
