// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CityAutocomplete } from '../../../components/ui/CityAutocomplete';
import { searchCitiesService } from '../../../lib/services/cityService';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock the service
vi.mock('@/lib/services/cityService', () => ({
  searchCitiesService: vi.fn(),
}));

describe('CityAutocomplete', () => {
  it('renders input correctly', () => {
    render(<CityAutocomplete value="" isEditing={true} onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/Digite o nome da cidade/i)).toBeInTheDocument();
  });

  it('fetches cities when typing', async () => {
    (searchCitiesService as any).mockResolvedValue({
      data: [
        { id: 1, name: 'São Paulo', state: 'SP' },
        { id: 2, name: 'São Roque', state: 'SP' }
      ],
      error: null
    });

    render(<CityAutocomplete value="" isEditing={true} onChange={() => {}} />);
    
    const input = screen.getByPlaceholderText(/Digite o nome da cidade/i);
    fireEvent.change(input, { target: { value: 'São' } });

    // Wait for debounce and call
    await waitFor(() => {
        expect(searchCitiesService).toHaveBeenCalledWith('São');
    });

    // Check if results are displayed
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
  });

  it('calls onSelect when a city is clicked', async () => {
     (searchCitiesService as any).mockResolvedValue({
      data: [
        { id: 1, name: 'Curitiba', state: 'PR' }
      ],
      error: null
    });
    const handleSelect = vi.fn();

    render(<CityAutocomplete value="" isEditing={true} onChange={handleSelect} />);
    
    const input = screen.getByPlaceholderText(/Digite o nome da cidade/i);
    fireEvent.change(input, { target: { value: 'Cur' } });

    await waitFor(() => {
        expect(screen.getByText('Curitiba')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Curitiba'));

    expect(handleSelect).toHaveBeenCalledWith({ name: 'Curitiba', state: 'PR' });
    // Check if input value updated
    expect(input).toHaveValue('Curitiba');
  });

  it('handles empty results', async () => {
    (searchCitiesService as any).mockResolvedValue({ data: [], error: null });

    render(<CityAutocomplete value="" isEditing={true} onChange={() => {}} />);
    
    const input = screen.getByPlaceholderText(/Digite o nome da cidade/i);
    fireEvent.change(input, { target: { value: 'Xyz' } });

    await waitFor(() => {
        expect(searchCitiesService).toHaveBeenCalledWith('Xyz');
    });

    expect(screen.queryByText('São Paulo')).not.toBeInTheDocument();
  });
});
