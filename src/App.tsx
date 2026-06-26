import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Dashboard } from './routes/Dashboard'
import { LiveAnnotation } from './routes/LiveAnnotation'
import { PreviewAnnotator } from './routes/PreviewAnnotator'
import { ProjectConfiguration } from './routes/ProjectConfiguration'
import { Results } from './routes/Results'
import { Settings } from './routes/Settings'
import { Templates } from './routes/Templates'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={<Settings />} />
        <Route path="results" element={<Results />} />
        <Route path="projects/new" element={<ProjectConfiguration />} />
        <Route path="projects/:id/configure" element={<ProjectConfiguration />} />
        <Route path="projects/:id/preview" element={<PreviewAnnotator />} />
        <Route path="projects/:id/results" element={<Results />} />
        <Route path="annotate/:projectId" element={<LiveAnnotation />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}
