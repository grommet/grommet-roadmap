import React, { useEffect, useState } from 'react';
import { Grommet } from 'grommet';
import { grommet } from 'grommet/themes';
import Roadmap from './Roadmap';
import Manage from './Manage';

const browserThemeMode = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const App = () => {
  const [themeMode, setThemeMode] = useState();
  const [identifier, setIdentifier] = useState();

  // align the themeMode with the browser/OS setting
  useEffect(() => {
    if (window.matchMedia) setThemeMode(browserThemeMode());
  }, []);

  // load id from URL, if any
  useEffect(() => {
    const id = window.location.pathname.slice(1);
    setIdentifier(id ? { id } : false);
  }, []);

  return (
    <Grommet full theme={grommet} themeMode={themeMode}>
      {identifier ? (
        <Roadmap
          identifier={identifier}
          onClose={() => {
            window.history.pushState(undefined, undefined, '/');
            setIdentifier(undefined);
          }}
          onThemeMode={(mode) =>
            setThemeMode(mode === 'auto' ? browserThemeMode() : mode)
          }
        />
      ) : (
        <Manage
          onSelect={(nextIdentifier) => {
            window.history.pushState(
              undefined,
              undefined,
              `/${nextIdentifier.id}`,
            );
            setIdentifier(nextIdentifier);
          }}
        />
      )}
    </Grommet>
  );
};

export default App;
