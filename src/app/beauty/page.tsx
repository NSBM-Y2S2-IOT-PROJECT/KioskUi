"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Header from '@/components/Header';
import { Instrument_Serif } from "next/font/google";
import FaceDisplay from '@/components/FaceDisplay';
import { Canvas } from "@react-three/fiber";

const instrumentSerif = Instrument_Serif({ 
  weight: "400",
  subsets: ["latin"]
});

export default function Home() {
  const ThreeCard = dynamic(() => import("../../components/ThreeCard"), {
    ssr: false,
  });
  return (
    <main className="min-h-screen">
      <Header />
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,0,80,0.4), transparent 60%)",
              filter: "blur(80px)",
              animation: "pulse 5s ease-in-out infinite",
            }}
          />
        </div>

        <Canvas>
          <ThreeCard
            initialWidth={1}
            initialHeight={1}
            initialDepth={1}
            follow_mouse={false}
            auto_rotate={true}
          />
        </Canvas>
      </div>
      
      <div className="container mx-auto pt-24 px-4">
        <div className="text-center mb-12">
          <h2 className={`text-4xl pt-20 text-white font-bold mb-3 ${instrumentSerif.className}`}
            style={{
              textShadow: `
                0 0 10px rgba(255, 0, 80, 0.4),
                0 0 20px rgba(255, 0, 80, 0.3),
                0 0 30px rgba(255, 0, 80, 0.2)
              `
            }}
          >
            Golden Ratio Beauty Analysis
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex justify-center">
            <FaceDisplay />
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 text-white">
            <h3 className={`text-2xl font-semibold mb-5 ${instrumentSerif.className}`}>The Science of Golden Ratio Beauty</h3>
            
            <div className={`space-y-6 ${instrumentSerif.className}`}>
              <div className="backdrop-blur-sm bg-white/5 rounded-xl p-5 border border-white/10">
                <h4 className="text-xl text-pink-300 mb-3">What is the Golden Ratio?</h4>
                <p className="text-white/80">
                  The Golden Ratio (approximately 1:1.618) has been used for centuries in art and architecture to create aesthetically pleasing proportions. In facial analysis, this mathematical ratio helps determine facial harmony.
                </p>
              </div>
              
              <div className="backdrop-blur-sm bg-white/5 rounded-xl p-5 border border-white/10">
                <h4 className="text-xl text-pink-300 mb-3">How We Calculate Your Beauty Score</h4>
                <p className="text-white/80 mb-3">
                  Our AI measures key facial landmarks and calculates the ratios between them:
                </p>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Distance between eyes relative to facial width</li>
                  <li>Ratio of facial thirds (hairline to eyebrow, eyebrow to nose tip, nose tip to chin)</li>
                  <li>Symmetry between left and right sides of the face</li>
                </ul>
              </div>
              
              
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
