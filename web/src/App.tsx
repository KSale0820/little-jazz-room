import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { CreatePage } from './pages/CreatePage';
import { ExplorePage } from './pages/ExplorePage';
import { HomePage } from './pages/HomePage';
import { PracticePage } from './pages/PracticePage';
import { ProfilePage } from './pages/ProfilePage';
import { TracksPage } from './pages/TracksPage';
import { PracticeHubPage } from './pages/PracticeHubPage';
import { TunerPage } from './pages/TunerPage';
import { MetronomePage } from './pages/MetronomePage';
import { RoutineLibraryPage } from './pages/RoutineLibraryPage';
import { ProgressPage } from './pages/ProgressPage';
import { SignInPage, SignUpRedirect } from './pages/SignInPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpRedirect />} />
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="create" element={<CreatePage />} />
              <Route path="tracks" element={<TracksPage />} />
              <Route path="charts" element={<TracksPage />} />
              <Route path="routines" element={<RoutineLibraryPage />} />
              <Route path="practice" element={<PracticeHubPage />} />
              <Route path="tuner" element={<TunerPage />} />
              <Route path="metronome" element={<MetronomePage />} />
              <Route path="player" element={<PracticePage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
