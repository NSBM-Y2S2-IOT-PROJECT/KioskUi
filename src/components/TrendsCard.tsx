'use client';
import { useState, useEffect } from 'react';
import { FaMicrochip, FaLeaf, FaEye, FaWater } from 'react-icons/fa';

// Simulate fetching real-time data (Mock API)
const fetchTrends = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          title: 'AI Skin Analysis',
          description: 'Real-time diagnostics with smart mirrors & mobile apps.',
          category: 'AI',
          tag: 'Tech',
          icon: <FaMicrochip />,
        },
        {
          title: 'Lab-Grown Skincare',
          description: 'Sustainable biotech ingredients like vegan collagen.',
          category: 'Eco',
          tag: 'Eco',
          icon: <FaLeaf />,
        },
        {
          title: 'Graphic Eyeliners',
          description: 'Vibrant, floating liners popular across runways & socials.',
          category: 'Style',
          tag: 'Style',
          icon: <FaEye />,
        },
        {
          title: 'Water-Saving Routines',
          description: 'Beauty routines designed to conserve water usage.',
          category: 'Eco',
          tag: 'Eco',
          icon: <FaWater />,
        },
      ]);
    }, 1500); // Simulate loading time
  });
};

export default function TrendsCard() {
  const [trends, setTrends] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch trends when the component mounts
  useEffect(() => {
    const loadTrends = async () => {
      const data = await fetchTrends(); // Fetch the mock data
      setTrends(data);
      setLoading(false);
    };
    loadTrends();
  }, []);

  // Toggle the expanded view
  const toggleExpansion = () => setIsExpanded(!isExpanded);

  if (loading) return <div className="text-white text-center">Loading...</div>;

  // Categorized trends example
  const categorizedTrends = {
    AI: trends.filter((trend) => trend.category === 'AI'),
    Eco: trends.filter((trend) => trend.category === 'Eco'),
    Style: trends.filter((trend) => trend.category === 'Style'),
  };

  return (
    <div className="bg-gradient-to-r from-pink-600 to-blue-600 p-8 rounded-xl text-center shadow-lg transform hover:scale-105 transition-all duration-500 ease-in-out relative max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-white mb-4">Latest Beauty Trends</h2>
      <p className="text-sm text-white/80 mb-6">
        Discover the most impactful beauty innovations, powered by AI and sustainability.
      </p>

      {/* Categorized Trends */}
      <div className="space-y-4 mb-6">
        {Object.entries(categorizedTrends).map(([category, trends], index) => (
          <div key={index}>
            <h3 className="text-lg font-semibold text-white">{category}</h3>
            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-start bg-white/10 rounded-xl p-4 gap-4 transition-all duration-300 ease-in-out hover:bg-white/20">
                  {/* Display icon depending on the trend */}
                  {trend.icon && <div className="text-white text-2xl">{trend.icon}</div>}
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {trend.title}
                      <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{trend.tag}</span>
                    </h4>
                    <p className="text-sm text-white/80">{trend.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Trends */}
      {isExpanded && (
        <div className="space-y-4 mb-4 transition-all duration-300 ease-in-out">
          {trends.slice(2).map((trend, index) => (
            <div key={index} className="flex items-start bg-white/10 rounded-xl p-4 gap-4 transition-all duration-300 ease-in-out hover:bg-white/20">
              {trend.icon && <div className="text-white text-2xl">{trend.icon}</div>}
              <div>
                <h4 className="font-semibold text-white flex items-center gap-2">
                  {trend.title}
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{trend.tag}</span>
                </h4>
                <p className="text-sm text-white/80">{trend.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Button to show more trends */}
      <button
        onClick={toggleExpansion}
        aria-expanded={isExpanded}
        className="mt-4 text-sm font-medium text-white hover:text-white/90 transition"
      >
        {isExpanded ? 'Show Less' : 'View All Trends'}
      </button>
    </div>
  );
}
