"use client";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { fetchSystemStatus } from "./services/sysCheck";
import { useState, useEffect, memo } from 'react';

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
ThreeJSContainer.displayName = 'ThreeJSContainer';

// Status display component that will re-render independently
const StatusDisplay = ({ status, error, loading }) => {
  const getStatusClass = (status) =>
    status === "True" ? "bg-green-800" : "bg-red-950";

  return (
    <>
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 pt-5 w-full flex flex-col items-center text-sm">
        <div>System Debug [VSM_V1]</div>
        <div className={`${getStatusClass(status.BtLowEnergy)}`}>
          Bluetooth: {status.BtLowEnergy === "True" ? "Available" : "Unavailable"}
        </div>
        <div className={`${getStatusClass(status.GPIO)}`}>
          GPIO Device: {status.GPIO === "True" ? "Available" : "Unavailable"}
        </div>
        <div className={`${getStatusClass(status.VisumServer)}`}>
          VSM Server: {status.VisumServer === "True" ? "Available" : "Unavailable"}
        </div>
        {error && <div className="bg-yellow-800 mt-1">Error: {error}</div>}
      </div>

      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 pb-5 flex flex-col items-center text-sm">
        <div>Gesture Input Tracker</div>
        <div className={`${getStatusClass(status.Kinect)}`}>
          Kinect: {status.Kinect === "True" ? "Connected" : "Disconnected"}
          {loading && " (Loading...)"}
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
    VisumServer: "False"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getSystemStatus = async () => {
      try {
        setLoading(true);
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://10.42.0.53:5000";
        const moduleStatus = await fetchSystemStatus(serverUrl);
        setStatus(moduleStatus);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch system status");
      } finally {
        setLoading(false);
      }
    };

    getSystemStatus();
    const interval = setInterval(getSystemStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "20vw",
        height: "40vh",
        border: "0.5px solid grey",
        borderRadius: "10px",
        backgroundColor: "black",
      }}
    >
      {/* Memoized ThreeJS canvas that won't re-render */}
      <ThreeJSContainer />
      
      {/* Status UI that will re-render on state changes */}
      <StatusDisplay status={status} error={error} loading={loading} />
    </div>
  );
}