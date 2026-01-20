// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import FilterPills from '../../../components/FilterPills';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

describe('FilterPills', () => {
  it('renders all filter options', () => {
    render(<FilterPills selectedFilter="Parceiros" onSelectFilter={() => {}} />);
    
    expect(screen.getByText('Seleção Nubo')).toBeInTheDocument();
    expect(screen.getByText('SISU')).toBeInTheDocument();
    expect(screen.getByText('Prouni')).toBeInTheDocument();
    expect(screen.getByText('Ações afirmativas')).toBeInTheDocument();
    expect(screen.getByText('EAD')).toBeInTheDocument();
    expect(screen.getByText('Oportunidades de parceiros')).toBeInTheDocument();
  });

  it('highlights the selected filter', () => {
    render(<FilterPills selectedFilter="SISU" onSelectFilter={() => {}} />);
    
    const selectedPill = screen.getByText('SISU');
    const unselectedPill = screen.getByText('Prouni');

    // Check for selected class (bg-[#024F86] text-white)
    expect(selectedPill.className).toContain('bg-[#024F86]');
    expect(selectedPill.className).toContain('text-white');

    // Check for unselected class (bg-white/10)
    expect(unselectedPill.className).toContain('bg-white/10');
  });

  it('calls onSelectFilter when different filter is clicked', () => {
    const handleSelectFilter = vi.fn();
    render(<FilterPills selectedFilter="Seleção Nubo" onSelectFilter={handleSelectFilter} />);
    
    fireEvent.click(screen.getByText('EAD'));
    
    expect(handleSelectFilter).toHaveBeenCalledWith('EAD');
  });
});
