"use client";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { fetchSystemStatus } from "./services/sysCheck";
import { useState, useEffect, memo } from "react";
import SERVER_ADDRESS from "config";

// Memoized ThreeJS component that won't re-render when parent state changes
const ThreeJSContainer = memo(() => {
  const ThreeCard = dynamic(() => import("../components/ThreeCard"), {
    ssr: false,
  });

  return (
    <Canvas>
      <ThreeCard
        initialWidth={2}
        initialHeight={2}
        initialDepth={2}
        follow_mouse={true}
        auto_rotate={true}
      />
    </Canvas>
  );
});
ThreeJSContainer.displayName = "ThreeJSContainer";

// Status display component that will re-render independently
const StatusDisplay = ({ status, error, loading }) => {
  const getStatusClass = (isActive) =>
    isActive === "True" 
      ? "bg-gradient-to-r from-green-900 to-green-800 border-green-600" 
      : "bg-gradient-to-r from-red-950 to-red-900 border-red-800";

  const StatusIndicator = ({ label, status, customClass }) => (
    <div className={`${customClass} px-3 py-1 rounded-md my-1 text-center flex items-center justify-center space-x-2 shadow-md border transition-all duration-300 w-4/5`}>
      <span className={`w-2 h-2 rounded-full ${status ? 'bg-green-400' : 'bg-red-500'} ${loading ? 'animate-pulse' : ''}`}></span>
      <span>{label}: <span className="font-medium">{status ? "Available" : "Unavailable"}</span></span>
    </div>
  );

  return (
    <>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 pt-5 w-full flex flex-col items-center text-xs backdrop-blur-md">
        <div className="font-bold text-cyan-300 text-sm mb-2 tracking-wide">System Debug [VSM_V1]</div>
        
        <StatusIndicator 
          label="Bluetooth" 
          status={status.BtLowEnergy === "True"} 
          customClass={getStatusClass(status.BtLowEnergy)} 
        />
        
        <StatusIndicator 
          label="GPIO Device" 
          status={status.GPIO === "True"} 
          customClass={getStatusClass(status.GPIO)} 
        />
        
        <StatusIndicator 
          label="VSM Server" 
          status={!error} 
          customClass={!error 
            ? "bg-gradient-to-r from-green-900 to-green-800 border-green-600" 
            : "bg-gradient-to-r from-red-950 to-red-900 border-red-800"} 
        />
        
        {error && (
          <div className="bg-gradient-to-r from-yellow-900 to-amber-800 border border-yellow-700 px-3 py-1 rounded-md mt-2 text-xs max-w-[90%] text-center shadow-md">
            <span className="font-medium text-yellow-200">Error:</span> <span className="text-yellow-100">{error}</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 pb-5 flex flex-col items-center text-xs">
        <div className="font-bold text-cyan-300 mb-2 tracking-wide">Gesture Input Tracker</div>
        <div className={`${getStatusClass(status.Kinect)} px-3 py-1 rounded-md text-center flex items-center justify-center space-x-2 shadow-md border w-4/5`}>
          <span className={`w-2 h-2 rounded-full ${status.Kinect === "True" ? 'bg-green-400' : 'bg-red-500'} ${loading ? 'animate-pulse' : ''}`}></span>
          <span>
            Kinect: <span className="font-medium">{status.Kinect === "True" ? "Connected" : "Disconnected"}</span>
            {loading && <span className="ml-1 animate-pulse">•••</span>}
          </span>
        </div>
      </div>
    </>
  );
};

export default function SystemOverview() {
  const [status, setStatus] = useState({
    Kinect: "False",
    BtLowEnergy: "False",
    GPIO: "False",
    VisumServer: "False",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const getSystemStatus = async () => {
      try {
        setLoading(true);
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || SERVER_ADDRESS;
        const moduleStatus = await fetchSystemStatus(serverUrl);
        setStatus(moduleStatus);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch system status",
        );
      } finally {
        setLoading(false);
      }
    };

    getSystemStatus();
    const interval = setInterval(getSystemStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsMaximized(false);
  };

  const handleMaximize = () => {
    setIsMaximized(true);
    setIsMinimized(false);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsMaximized(false);
  };

  const getContainerStyle = () => {
    const baseStyle = {
      position: "absolute",
      right: "0",
      border: "0.5px solid rgba(100, 116, 139, 0.5)",
      borderRadius: "10px",
      background: "linear-gradient(45deg, rgba(0,0,0,0.95), rgba(15,23,42,0.9))",
      boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
      overflow: "hidden",
      backdropFilter: "blur(5px)",
      transition: "all 0.3s ease-in-out",
    };

    if (isMinimized) {
      return {
        ...baseStyle,
        bottom: "0",
        width: "180px",
        height: "40px",
      };
    } else if (isMaximized) {
      return {
        ...baseStyle,
        top: "20px",
        right: "20px",
        bottom: "20px",
        width: "40vw",
        height: "80vh",
      };
    } else {
      return {
        ...baseStyle,
        bottom: "0",
        width: "20vw",
        height: "40vh",
      };
    }
  };

  return (
    <div style={getContainerStyle()}>
      {/* Window Controls */}
      <div className="absolute top-0 right-0 p-2 z-10 flex space-x-2">
        <button 
          onClick={isMinimized ? handleRestore : handleMinimize} 
          className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xs transition-colors"
          title={isMinimized ? "Restore" : "Minimize"}
        >
          {isMinimized ? "□" : "_"}
        </button>
        <button 
          onClick={isMaximized ? handleRestore : handleMaximize}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xs transition-colors"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? "□" : "□"}
        </button>
      </div>

      {/* Content displayed based on state */}
      {!isMinimized ? (
        <>
          {/* Memoized ThreeJS canvas that won't re-render */}
          <ThreeJSContainer />

          {/* Status UI that will re-render on state changes */}
          <StatusDisplay status={status} error={error} loading={loading} />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-cyan-300 font-medium">System Stats</span>
          <span className={`ml-2 w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-400'} ${loading ? 'animate-pulse' : ''}`}></span>
        </div>
      )}
    </div>
  );
}
