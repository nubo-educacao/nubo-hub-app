'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { searchCitiesService, City } from '@/lib/services/cityService';

interface CityAutocompleteProps {
    label?: string;
    value: string;
    stateValue?: string;
    onChange: (city: { name: string; state: string } | null) => void;
    isEditing: boolean;
    placeholder?: string;
}

export function CityAutocomplete({
    label = 'Cidade de Preferência',
    value,
    stateValue,
    onChange,
    isEditing,
    placeholder = 'Digite o nome da cidade...'
}: CityAutocompleteProps) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState<City[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Sync value prop with query state
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchCities = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        const { data, error } = await searchCitiesService(searchQuery);
        setLoading(false);

        if (data && !error) {
            setSuggestions(data);
            setIsOpen(data.length > 0);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        // Debounce API calls
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            searchCities(newQuery);
        }, 300);
    };

    const handleSelectCity = (city: City) => {
        setQuery(city.name); // Only show city name in input
        setSuggestions([]);
        setIsOpen(false);
        onChange({ name: city.name, state: city.state });
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        onChange(null);
    };

    // Read-only display
    if (!isEditing) {
        const displayValue = value ? (stateValue ? `${value} - ${stateValue}` : value) : null;
        return (
            <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                    <MapPin size={14} />
                    {label}
                </label>
                <div className="text-[#3A424E] font-medium px-1 truncate min-h-[24px]">
                    {displayValue || <span className="text-gray-400 italic">Não informado</span>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
            <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                <MapPin size={14} />
                {label}
            </label>
            
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all w-full placeholder:text-gray-400 pr-10"
                />
                
                {/* Loading/Clear indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="hover:text-red-500 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Dropdown */}
                {isOpen && suggestions.length > 0 && (
                    <div className="absolute z-[9999] top-full left-0 w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-lg max-h-60 overflow-y-auto">
                        <div className="p-1">
                            {suggestions.map((city) => (
                                <div
                                    key={`${city.id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors text-[#3A424E] hover:bg-[#E0F2FE]"
                                    onClick={() => handleSelectCity(city)}
                                >
                                    <MapPin size={14} className="text-[#1BBBCD] flex-shrink-0" />
                                    <span className="flex-1">
                                        <span className="font-medium">{city.name}</span>
                                        <span className="text-gray-500"> - {city.state}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No results message */}
                {isOpen && query.length >= 2 && !loading && suggestions.length === 0 && (
                    <div className="absolute z-[9999] top-full left-0 w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-3 text-sm text-gray-500 text-center">
                        Nenhuma cidade encontrada
                    </div>
                )}
            </div>
        </div>
    );
}
