'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Loader2, X, Check } from 'lucide-react';
import { getAvailableCoursesService } from '@/services/supabase/preferences';

interface CourseAutocompleteProps {
    label?: string;
    selected: string[];
    onChange: (courses: string[]) => void;
    isEditing: boolean;
    placeholder?: string;
}

export function CourseAutocomplete({
    label = 'Cursos de Interesse',
    selected,
    onChange,
    isEditing,
    placeholder = 'Digite o nome do curso...'
}: CourseAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [allCourses, setAllCourses] = useState<string[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load all courses once on mount
    useEffect(() => {
        const fetchCourses = async () => {
            setInitialLoading(true);
            const { data } = await getAvailableCoursesService();
            if (data) {
                setAllCourses(data);
            }
            setInitialLoading(false);
        };
        fetchCourses();
    }, []);

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

    // Filter courses based on query
    const filterCourses = useCallback((searchQuery: string) => {
        if (searchQuery.length < 2) {
            setFilteredCourses([]);
            return;
        }

        setLoading(true);
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = allCourses
            .filter(course => course.toLowerCase().includes(lowerQuery))
            .slice(0, 15); // Limit to 15 results
        setFilteredCourses(filtered);
        setIsOpen(filtered.length > 0);
        setLoading(false);
    }, [allCourses]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        filterCourses(newQuery);
    };

    const handleSelectCourse = (course: string) => {
        if (selected.includes(course)) {
            // If already selected, remove it
            onChange(selected.filter(c => c !== course));
        } else {
            // Add to selection
            onChange([...selected, course]);
        }
        // Keep dropdown open for multi-select
    };

    const handleRemoveCourse = (e: React.MouseEvent, course: string) => {
        e.stopPropagation();
        onChange(selected.filter(c => c !== course));
    };

    // Read-only display (pills)
    if (!isEditing) {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                    <BookOpen size={14} />
                    {label}
                </label>
                <div className="flex flex-wrap gap-1">
                    {selected && selected.length > 0 ? (
                        selected.map((course, idx) => (
                            <span key={idx} className="bg-[#E0F2FE] text-[#024F86] text-xs px-2 py-0.5 rounded-full">
                                {course}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 italic">Não informado</span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
            <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                <BookOpen size={14} />
                {label}
            </label>
            
            {/* Selected pills */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                    {selected.map((course) => (
                        <div 
                            key={course} 
                            className="bg-[#E0F2FE] text-[#024F86] text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
                        >
                            {course}
                            <button
                                type="button"
                                onClick={(e) => handleRemoveCourse(e, course)}
                                className="hover:text-red-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => filteredCourses.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={initialLoading}
                    className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all w-full placeholder:text-gray-400 pr-10 disabled:opacity-50"
                />
                
                {/* Loading indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {(loading || initialLoading) && (
                        <Loader2 size={16} className="animate-spin" />
                    )}
                </div>

                {/* Dropdown */}
                {isOpen && filteredCourses.length > 0 && (
                    <div className="absolute z-[9999] top-full left-0 w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-lg max-h-60 overflow-y-auto">
                        <div className="p-1">
                            {filteredCourses.map((course) => {
                                const isSelected = selected.includes(course);
                                return (
                                    <div
                                        key={course}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                                            isSelected 
                                                ? 'bg-[#E0F2FE] text-[#024F86]' 
                                                : 'text-[#3A424E] hover:bg-gray-50'
                                        }`}
                                        onClick={() => handleSelectCourse(course)}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                            isSelected ? 'bg-[#38B1E4] border-[#38B1E4] text-white' : 'border-gray-300 bg-white'
                                        }`}>
                                            {isSelected && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        <span className="flex-1 truncate">{course}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* No results message */}
                {isOpen && query.length >= 2 && !loading && filteredCourses.length === 0 && (
                    <div className="absolute z-[9999] top-full left-0 w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-3 text-sm text-gray-500 text-center">
                        Nenhum curso encontrado
                    </div>
                )}
            </div>
        </div>
    );
}
