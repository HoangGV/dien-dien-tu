import React, { useEffect, useState } from 'react';
import { HomePage } from './views/HomePage';
import { WorkspaceView } from './views/WorkspaceView';
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

  // Parse hash route
  // e.g. "#/mo-phong/mang-dien-trong-nha" or "#/mo-phong/mach-dien-tu-co-ban"
  const matchWorkspace = currentHash.match(/^#\/mo-phong\/([a-zA-Z0-9\-_]+)/);

  return (
    <>
      {matchWorkspace ? (
        <WorkspaceView slug={matchWorkspace[1]} />
      ) : (
        <HomePage />
      )}
      <OfflineIndicator />
    </>
  );
}
