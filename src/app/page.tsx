"use client";
import dynamic from "next/dynamic";
import Text from "react";
import GlassCard from "@/components/glscard";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import { Instrument_Serif } from "next/font/google";

export default function Home() {
  const ThreeCard = dynamic(() => import("../components/ThreeCard"), {
    ssr: false,
  });

  return (
    <>
      <div
        style={{
          position: "relative",
        }}
      >
        <img
          src="/nav.svg" // Assuming 'nav.svg' is in the public folder
          alt="Navigation Icon"
          style={{
            position: "absolute",
            top: "-50px",
            left: "0",
            width: "auto",
            height: "250px",
          }}
        />
      </div>

      <div className="absolute w-screen h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Canvas>
            <ThreeCard
              initialWidth={2}
              initialHeight={2}
              initialDepth={2}
              follow_mouse={true}
              // auto_rotate={true}
            />
          </Canvas>
        </div>
      </div>

      <SystemOverview />

      <div className="flex items-center justify-center h-screen ">
        <GlassCard
          heading="- Welcome ! -"
          description={
            <>
              This is the VISUM Interactive Kiosk System. We will help you with
              all of your skincare needs...
            </>
          }
          textSize="text-[50pt]"
          textSize2="text-[20pt]"
          boxWidth="w-[600px]"
          boxHeight="h-[500px]"
          tilt={true}
          centerText={true}
          showButton={true}
          buttonText="Let's Get Started !"
          onpress={() => {
            console.log("Button clicked!");
            // Add your button click logic here
          }}
        />
      </div>
    </>
  );
}
