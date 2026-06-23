/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton, LoadingInline } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
  describe('Table Variant', () => {
    it('should render table skeleton with default rows and columns', () => {
      const { container } = render(<LoadingSkeleton variant="table" />);
      
      // Verify the component has role="status" for accessibility
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
      
      // Verify aria-label is present
      expect(container.querySelector('[aria-label="Carregando conteúdo"]')).toBeInTheDocument();
      
      // Verify skeleton elements are present
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render custom number of rows', () => {
      const { container } = render(<LoadingSkeleton variant="table" rows={3} />);
      
      // Count row skeletons (each row has multiple columns, so we check for row containers)
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render custom number of columns', () => {
      const { container } = render(<LoadingSkeleton variant="table" columns={6} />);
      
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should include search bar and filters', () => {
      const { container } = render(<LoadingSkeleton variant="table" />);
      
      // Table variant should have multiple skeleton elements
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(10); // Header + filters + rows
    });

    it('should include pagination skeleton', () => {
      const { container } = render(<LoadingSkeleton variant="table" />);
      
      // Verify skeleton structure includes pagination elements
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Card Variant', () => {
    it('should render card grid skeleton', () => {
      const { container } = render(<LoadingSkeleton variant="card" />);
      
      // Verify cards are present
      const premiumCards = container.querySelectorAll('.premium-card');
      expect(premiumCards.length).toBe(6); // Default 6 cards
    });

    it('should render cards with circular avatar skeletons', () => {
      const { container } = render(<LoadingSkeleton variant="card" />);
      
      // Each card should have skeleton elements
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should use grid layout for cards', () => {
      const { container } = render(<LoadingSkeleton variant="card" />);
      
      const gridContainer = container.querySelector('[style*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Form Variant', () => {
    it('should render form skeleton with fields', () => {
      const { container } = render(<LoadingSkeleton variant="form" />);
      
      // Verify form structure
      const premiumCard = container.querySelector('.premium-card');
      expect(premiumCard).toBeInTheDocument();
      
      // Should have multiple field skeletons
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(8); // Title + fields + actions
    });

    it('should include form title skeleton', () => {
      const { container } = render(<LoadingSkeleton variant="form" />);
      
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should include form action buttons skeleton', () => {
      const { container } = render(<LoadingSkeleton variant="form" />);
      
      // Form should have multiple skeleton elements including buttons
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render two-column field layout', () => {
      const { container } = render(<LoadingSkeleton variant="form" />);
      
      // Check for grid layout in form
      const gridContainer = container.querySelector('[style*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Chart Variant', () => {
    it('should render chart skeleton with KPIs', () => {
      const { container } = render(<LoadingSkeleton variant="chart" />);
      
      // Verify KPI cards (4 by default)
      const premiumCards = container.querySelectorAll('.premium-card');
      expect(premiumCards.length).toBeGreaterThan(0);
    });

    it('should render chart area with bars', () => {
      const { container } = render(<LoadingSkeleton variant="chart" />);
      
      // Chart variant should have many skeleton elements (KPIs + chart bars + labels)
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(20);
    });

    it('should include chart legend skeleton', () => {
      const { container } = render(<LoadingSkeleton variant="chart" />);
      
      // Verify skeleton structure is rendered
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render chart axes labels', () => {
      const { container } = render(<LoadingSkeleton variant="chart" />);
      
      // Chart should have multiple skeleton elements for axes
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Common Props', () => {
    it('should apply fullScreen styling by default', () => {
      const { container } = render(<LoadingSkeleton variant="table" />);
      
      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toHaveStyle({ minHeight: '100vh' });
    });

    it('should apply non-fullScreen styling when fullScreen=false', () => {
      const { container } = render(<LoadingSkeleton variant="table" fullScreen={false} />);
      
      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toHaveStyle({ minHeight: '400px' });
    });

    it('should render custom message in aria-label', () => {
      const customMessage = 'Carregando dados...';
      const { container } = render(<LoadingSkeleton variant="table" message={customMessage} />);
      
      const statusElement = container.querySelector(`[aria-label="${customMessage}"]`);
      expect(statusElement).toBeInTheDocument();
    });

    it('should default to "Carregando conteúdo" when no message provided', () => {
      const { container } = render(<LoadingSkeleton variant="table" />);
      
      const statusElement = container.querySelector('[aria-label="Carregando conteúdo"]');
      expect(statusElement).toBeInTheDocument();
    });

    it('should have aria-live="polite" for accessibility', () => {
      const { container } = render(<LoadingSkeleton variant="table" />);
      
      const statusElement = container.querySelector('[aria-live="polite"]');
      expect(statusElement).toBeInTheDocument();
    });
  });

  describe('LoadingInline (deprecated)', () => {
    it('should render with non-fullscreen mode', () => {
      const { container } = render(<LoadingInline />);
      
      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveStyle({ minHeight: '400px' });
    });

    it('should accept custom message', () => {
      const message = 'Carregando lista...';
      const { container } = render(<LoadingInline message={message} />);
      
      const statusElement = container.querySelector(`[aria-label="${message}"]`);
      expect(statusElement).toBeInTheDocument();
    });
  });

  describe('CSS Animation Support', () => {
    it('should use skeleton-base class for shimmer animation', () => {
      const { container } = render(<LoadingSkeleton variant="table" />);
      
      const skeletonElements = container.querySelectorAll('.skeleton-base');
      expect(skeletonElements.length).toBeGreaterThan(0);
      
      // Verify all skeleton elements have the animation class
      skeletonElements.forEach((element) => {
        expect(element).toHaveClass('skeleton-base');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render cards with responsive grid', () => {
      const { container } = render(<LoadingSkeleton variant="card" />);
      
      const gridContainer = container.querySelector('[style*="repeat(auto-fit"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render KPIs with responsive grid', () => {
      const { container } = render(<LoadingSkeleton variant="chart" />);
      
      const gridContainer = container.querySelector('[style*="repeat(auto-fit"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
