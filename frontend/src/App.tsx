import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { JoinPage } from './pages/JoinPage';
import { LogDetailPage } from './pages/LogDetailPage';
import { LogFormPage } from './pages/LogFormPage';
import { RecommendCouplePage } from './pages/RecommendCouplePage';
import { RecommendSoloPage } from './pages/RecommendSoloPage';
import { SettingsPage } from './pages/SettingsPage';
import { TimelinePage } from './pages/TimelinePage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recommend/solo" element={<RecommendSoloPage />} />
        <Route path="/recommend/couple" element={<RecommendCouplePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/logs/new" element={<LogFormPage />} />
        <Route path="/logs/:id" element={<LogDetailPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
