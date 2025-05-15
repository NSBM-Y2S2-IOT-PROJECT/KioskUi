"use client";

import { useState } from "react";
import GlassCard from "@/components/glscard";
import MicButton from "@/components/MicButton";
import { motion } from "framer-motion";
import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({ 
  weight: "400",
  subsets: ["latin"]
});

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="container mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center gap-8 py-12"
        >
          <h1 className={`${instrumentSerif.className} text-white text-4xl md:text-5xl text-center mb-4`}>
            Voice Assistant
          </h1>
          
          <GlassCard
            heading="Ask me anything"
            description="Tap the microphone button and speak. I'll listen to your question and provide an answer."
            boxWidth="w-full max-w-2xl"
            boxHeight="h-auto min-h-[400px]"
            textSize="text-2xl"
            textSize2="text-lg"
            centerText={true}
            tilt={false}
            buttonText=""
          >
            <div className="flex flex-col items-center justify-center h-full p-8">
              <MicButton />
            </div>
          </GlassCard>
          
          <div className="text-white text-center max-w-md text-sm opacity-70 mt-8">
            <p>This assistant uses voice recognition to understand your questions and voice synthesis to respond.</p>
            <p className="mt-2">Please speak clearly into your microphone when the button turns red.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}