"use client";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";

export default function SystemOverview() {
  const ThreeCard = dynamic(() => import("../components/ThreeCard"), {
    ssr: false,
  });

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
      // className="bg-transparent backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-[10px] border border-[rgba(255,255,255,0.18)] p-6"
    >
      <div className="absolute flex flex-col bottom-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center pb-5 text-sm">
        Gesture Input Tracker
        <div className="bg-red-950 text-sm"> Kinect: Disconnected </div>
      </div>

      <div className="absolute flex text-sm flex-col top-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center pt-5 w-full">
        System Debug [VSM_V1]
        <div className="bg-red-950 text-sm"> Bluetooth: Unavailable </div>
        <div className="bg-red-950 text-sm"> GPIO Device: Unavailable </div>
        <div className="bg-red-950 text-sm"> VSM Server: Unavailable </div>
      </div>

      <Canvas>
        <ThreeCard
          initialWidth={2}
          initialHeight={2}
          initialDepth={2}
          follow_mouse={true}
          auto_rotate={true}
        />
      </Canvas>
    </div>
  );
}
