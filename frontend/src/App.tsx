import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';

// Page들을 페이지별 청크로 분리 → 초기 번들 가벼워짐
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const RecommendSoloPage = lazy(() => import('./pages/RecommendSoloPage').then(m => ({ default: m.RecommendSoloPage })));
const RecommendCouplePage = lazy(() => import('./pages/RecommendCouplePage').then(m => ({ default: m.RecommendCouplePage })));
const JoinPage = lazy(() => import('./pages/JoinPage').then(m => ({ default: m.JoinPage })));
const LogFormPage = lazy(() => import('./pages/LogFormPage').then(m => ({ default: m.LogFormPage })));
const LogDetailPage = lazy(() => import('./pages/LogDetailPage').then(m => ({ default: m.LogDetailPage })));
const TimelinePage = lazy(() => import('./pages/TimelinePage').then(m => ({ default: m.TimelinePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

function PageFallback() {
  return (
    <div className="rounded-3xl border border-line bg-paper p-10 text-center">
      <div className="mx-auto mb-2 h-2 w-2 animate-pulse rounded-full bg-terracotta" />
      <p className="text-xs text-ink-3">불러오는 중...</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<Suspense fallback={<PageFallback />}><Outlet /></Suspense>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/recommend/solo" element={<RecommendSoloPage />} />
          <Route path="/recommend/couple" element={<RecommendCouplePage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/logs/new" element={<LogFormPage />} />
          <Route path="/logs/:id" element={<LogDetailPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
