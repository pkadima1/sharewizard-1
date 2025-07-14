import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import InspirationHubPage from './inspiration-hub';

// Mock the InspirationHub component
jest.mock('@/components/inspiration/InspirationHub', () => {
  return function MockInspirationHub() {
    return <div data-testid="inspiration-hub-component">Inspiration Hub Component</div>;
  };
});

// Mock the analytics functions
jest.mock('@/utils/analytics', () => ({
  trackPageView: jest.fn(),
  trackButtonClick: jest.fn(),
  trackFeatureUsage: jest.fn(),
}));

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('InspirationHubPage', () => {
  it('renders without crashing', () => {
    renderWithProviders(<InspirationHubPage />);
    expect(screen.getByTestId('inspiration-hub-component')).toBeInTheDocument();
  });

  it('displays the main title', () => {
    renderWithProviders(<InspirationHubPage />);
    expect(screen.getByText('hero.title')).toBeInTheDocument();
  });

  it('includes skip buttons', () => {
    renderWithProviders(<InspirationHubPage />);
    expect(screen.getByText('hero.skipButtons.captionGenerator')).toBeInTheDocument();
    expect(screen.getByText('hero.skipButtons.longformContent')).toBeInTheDocument();
  });

  it('shows quick actions section', () => {
    renderWithProviders(<InspirationHubPage />);
    expect(screen.getByText('quickActions.title')).toBeInTheDocument();
  });

  it('displays value proposition section', () => {
    renderWithProviders(<InspirationHubPage />);
    expect(screen.getByText('valueProposition.title')).toBeInTheDocument();
  });

  it('includes breadcrumb navigation', () => {
    renderWithProviders(<InspirationHubPage />);
    expect(screen.getByText('breadcrumbs.home')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs.inspiration')).toBeInTheDocument();
  });
}); 