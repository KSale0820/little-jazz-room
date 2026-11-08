import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AppearanceProvider } from './context/AppearanceContext';
import { CreatePage } from './pages/CreatePage';
import { ExplorePage } from './pages/ExplorePage';
import { PracticePage } from './pages/PracticePage';
import { FreePracticePage } from './pages/FreePracticePage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { TracksPage } from './pages/TracksPage';
import { PracticeHubPage } from './pages/PracticeHubPage';
import { TunerPage } from './pages/TunerPage';
import { MetronomePage } from './pages/MetronomePage';
import { RoutineLibraryPage } from './pages/RoutineLibraryPage';
import { ProgressRedesignPage } from './pages/ProgressRedesignPage';
import { SignInPage, SignUpRedirect } from './pages/SignInPage';
import { ChartBuilderPage } from './pages/ChartBuilderPage';
import { ChartLibraryPage } from './pages/ChartLibraryPage';

// Old free-mode links must never fall through to the chart player's first chart.
function PracticePlayerEntry() {
  const [params] = useSearchParams();
  return params.get('mode') === 'free' && !params.has('chart') && !params.has('recording') && !params.has('routine')
    ? <FreePracticePage /> : <PracticePage />;
}

export default function App() {
  return (
    <AppearanceProvider>
      <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpRedirect />} />
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/practice" replace />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="create" element={<CreatePage />} />
              <Route path="tracks" element={<TracksPage />} />
              <Route path="charts" element={<Navigate to="/tracks" replace />} />
              <Route path="my-charts" element={<ChartLibraryPage />} />
              <Route path="charts/new" element={<ChartBuilderPage />} />
              <Route path="charts/:chartId/edit" element={<ChartBuilderPage />} />
              <Route path="routines" element={<RoutineLibraryPage />} />
              <Route path="practice" element={<PracticeHubPage />} />
              <Route path="tuner" element={<TunerPage />} />
              <Route path="metronome" element={<MetronomePage />} />
              <Route path="free-practice" element={<FreePracticePage />} />
              <Route path="player" element={<PracticePlayerEntry />} />
              <Route path="progress" element={<ProgressRedesignPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
      </BrowserRouter>
    </AppearanceProvider>
  );
}
