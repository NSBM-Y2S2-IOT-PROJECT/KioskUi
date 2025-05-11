'use client';
import { useState } from 'react';

const icons = ['Lips', 'Eye', 'Brows', 'Proportion', 'Skin', 'Face', 'Eyeshadow'];

export default function FeatureIcons() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = async (filter: string) => {
    const isSelected = selectedFilters.includes(filter);
    const newFilters = isSelected
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];

    setSelectedFilters(newFilters);

    try {
      await fetch('http://localhost:5000/data/apply-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: newFilters }),
      });
    } catch (error) {
      console.error('Failed to send filters:', error);
    }
  };

  return (
    <div className="flex gap-2 items-center justify-center mt-2 bg-black/50 p-2 rounded-xl">
      {icons.map((icon, index) => (
        <div
          key={index}
          onClick={() => toggleFilter(icon)}
          className={`w-16 h-8 flex items-center justify-center cursor-pointer rounded-md p-1 text-sm font-semibold transition ${
            selectedFilters.includes(icon)
              ? 'text-white font-bold'  // Bold and white when selected
              : 'text-white opacity-60 hover:opacity-100'  // Normal state
          }`}
        >
          {icon}
        </div>
      ))}
    </div>
  );
}
