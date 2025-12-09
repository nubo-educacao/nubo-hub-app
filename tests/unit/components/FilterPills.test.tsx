import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPills from '@/components/FilterPills';

describe('FilterPills', () => {
  it('renders all filter options', () => {
    render(<FilterPills selectedFilter="Parceiros" onSelectFilter={() => {}} />);
    
    expect(screen.getByText('Parceiros')).toBeInTheDocument();
    expect(screen.getByText('Públicas')).toBeInTheDocument();
    expect(screen.getByText('Vagas ociosas')).toBeInTheDocument();
    expect(screen.getByText('Bolsas integrais')).toBeInTheDocument();
    expect(screen.getByText('Bolsas parciais')).toBeInTheDocument();
    expect(screen.getByText('EAD')).toBeInTheDocument();
  });

  it('highlights the selected filter', () => {
    render(<FilterPills selectedFilter="Públicas" onSelectFilter={() => {}} />);
    
    const selectedPill = screen.getByText('Públicas');
    const unselectedPill = screen.getByText('Parceiros');

    // Check for selected class (bg-[#024F86] text-white)
    expect(selectedPill.className).toContain('bg-[#024F86]');
    expect(selectedPill.className).toContain('text-white');

    // Check for unselected class (bg-white/10)
    expect(unselectedPill.className).toContain('bg-white/10');
  });

  it('calls onSelectFilter when different filter is clicked', () => {
    const handleSelectFilter = vi.fn();
    render(<FilterPills selectedFilter="Parceiros" onSelectFilter={handleSelectFilter} />);
    
    fireEvent.click(screen.getByText('EAD'));
    
    expect(handleSelectFilter).toHaveBeenCalledWith('EAD');
  });
});
