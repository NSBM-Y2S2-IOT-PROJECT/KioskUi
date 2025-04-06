import React from "react";

interface CameraUICardProps {
  onBack?: () => void;
  onSave?: () => void;
  chatHistory?: string;
}

const CameraUICard: React.FC<CameraUICardProps> = ({
  onBack = () => console.log("Back clicked"),
  onSave = () => console.log("Save clicked"),
  chatHistory = "This is a Chat History Demo",
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md mx-auto">
      {/* Top options row */}
      <div className="flex justify-between mb-4">
        <button className="px-4 py-2 bg-gray-100 rounded-lg text-gray-800 text-base flex-1 mx-1 hover:bg-gray-200 transition">
          Skin Color
        </button>
        <button className="px-4 py-2 bg-gray-100 rounded-lg text-gray-800 text-base flex-1 mx-1 hover:bg-gray-200 transition">
          Skin Texture
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between mb-6">
        <button
          onClick={onBack}
          className="px-4 py-3 bg-gray-200 rounded-lg text-gray-800 font-medium text-base w-[48%] hover:bg-gray-300 transition"
        >
          Back
        </button>
        <button
          onClick={onSave}
          className="px-4 py-3 bg-gray-200 rounded-lg text-gray-800 font-medium text-base w-[48%] hover:bg-gray-300 transition"
        >
          Save
        </button>
      </div>

      {/* Chat history section */}
      <div className="bg-gray-50 rounded-lg p-3 mb-6">
        <h3 className="text-gray-900 font-bold text-lg mb-2"># Camera Ui</h3>
        <p className="text-gray-700 text-sm">{chatHistory}</p>
      </div>

      {/* Speak button */}
      <button className="w-full py-4 bg-blue-500 rounded-lg text-white font-bold text-base hover:bg-blue-600 transition">
        Speak
      </button>
    </div>
  );
};

export default CameraUICard;
