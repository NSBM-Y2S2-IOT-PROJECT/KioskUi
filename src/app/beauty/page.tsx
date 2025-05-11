import Header from '@/components/Header'; // Import the Header component
import CameraToggle from '@/components/CameraToggle';
import FaceDisplay from '@/components/FaceDisplay';
import FeatureIcons from '@/components/FeatureIcons';
import AnalysisCard from '@/components/AnalysisCard';
import ExpressionCard from '@/components/ExpressionCard';
import TrendsCard from '@/components/TrendsCard';

export default function Home() {
  return (
    <main className="flex flex-col items-center gap-6 p-4">
      {/* Include the Header component */}
      <Header />
      <FaceDisplay />
      <FeatureIcons />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl mt-6">
        <AnalysisCard />
        <ExpressionCard />
        <TrendsCard />
      </div>
    </main>
  );
}
