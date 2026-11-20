import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useFullscreen } from '../hooks/useFullscreen';

const TestComponent: React.FC = () => {
  const { isFullscreen, isSupported } = useFullscreen();
  return (
    <div>
      <span id="fullscreen">{isFullscreen ? 'active' : 'inactive'}</span>
      <span id="supported">{isSupported ? 'yes' : 'no'}</span>
    </div>
  );
};

describe('useFullscreen Hook', () => {
  it('renders without error and initializes isFullscreen as inactive', () => {
    const html = ReactDOMServer.renderToString(<TestComponent />);
    expect(html).toContain('inactive');
  });
});

