"use client";

import { useState } from "react";
import GlassCard from "@/components/glscard";
import MicButton from "@/components/MicButton";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import SystemOverview from "@/components/systemStat";

const instrumentSerif = Instrument_Serif({ 
  weight: "400",
  subsets: ["latin"]
});

export default function AssistantPage() {
  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        body::-webkit-scrollbar {
          display: none;
        }

        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="absolute w-screen h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,0,80,0.4), transparent 70%)",
              filter: "blur(80px)",
              animation: "pulse 8s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <SystemOverview />

      <div className="flex items-center justify-center h-screen px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ 
            animation: "slideIn 0.5s ease-out",
            position: "relative",
            zIndex: 5
          }}
        >
          <GlassCard
            heading="Voice Assistant"
            description={
              <>
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <p className="text-white text-lg mb-8 text-center">
                    Tap the microphone button and speak. I'll listen to your question and provide an answer.
                  </p>
                  <MicButton />
                </div>
                <div className="text-white text-center text-sm opacity-70 mt-8">
                  <p>This assistant uses voice recognition to understand your questions and voice synthesis to respond.</p>
                  <p className="mt-2">Please speak clearly into your microphone when the button turns red.</p>
                </div>
              </>
            }
            boxWidth="w-[600px]"
            boxHeight="h-[550px]"
            textSize="text-[40pt]"
            textSize2="text-[18pt]"
            centerText={true}
            tilt={true}
            showButton={false}
          />
        </motion.div>
      </div>
    </>
  );
}