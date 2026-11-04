import React, { useEffect, useState } from 'react';
import { HomePage } from './views/HomePage';
import { WorkspaceView } from './views/WorkspaceView';
import { SolverTestView } from './views/SolverTestView';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { getWorkspaceBySlug, WORKSPACE_HOUSEHOLD } from './core/workspaces';

export default function App() {
  const [currentHash, setCurrentHash] = useState<string>(
    typeof window !== 'undefined' ? window.location.hash || '#/' : '#/'
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check solver test suite route
  const isSolverTest = currentHash === '#/kiem-tra-bo-giai';

  // Parse hash route
  // e.g. "#/mo-phong/mang-dien-trong-nha" or "#/mo-phong/mach-dien-tu-co-ban" or "#/mo-phong/_thu"
  const matchWorkspace = currentHash.match(/^#\/mo-phong\/([a-zA-Z0-9\-_]+)/);

  return (
    <>
      {isSolverTest ? (
        <SolverTestView />
      ) : matchWorkspace ? (
        <WorkspaceView slug={matchWorkspace[1]} />
      ) : (
        <HomePage />
      )}
      <OfflineIndicator />
    </>
  );
}
