"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import GlassCard from "@/components/glscard";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import BluetoothScanner from "@/components/bluetoothCard";

export default function Home() {
  const [signalCompleted, setSignalCompleted] = useState(false);
  const [showCameraCard, setShowCameraCard] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isHoveringLeft, setIsHoveringLeft] = useState(false);
  const [isHoveringRight, setIsHoveringRight] = useState(false);

  const ThreeCard = dynamic(() => import("../components/ThreeCard"), {
    ssr: false,
  });

  const menuCards = [
    {
      heading: "Skin Analysis",
      description: "Get a detailed analysis of your skin condition with our advanced scanning technology.",
      buttonText: "Start Scan",
      onButtonClick: () => window.location.href = "/scanner",
    },
    {
      heading: "Beauty Calculator",
      description: "Calculate your beauty score using golden ratio",
      buttonText: "Calculate",
      onButtonClick: () => window.location.href = "/beauty",
    },
    {
      heading: "Interaction Log",
      description: "Your Previous Interactions with our system",
      buttonText: "Check Interaction",
      onButtonClick: () => window.location.href = "/interactions",
    },
    {
      heading: "Virtual Assistant",
      description: "Chat with our AI assistant to get answers to all your skincare questions.",
      buttonText: "Talk to Assistant",
      onButtonClick: () => window.location.href = "/assistant",
    },
  ];

  const handleClick = () => {
    window.location.href = "/scanner";
  };

  const handleSignalComplete = () => {
    setIsFading(true); // Trigger fade-out effect
    setTimeout(() => {
      setSignalCompleted(true); // After fade-out, show the new card
      setIsFading(false); // Reset fading state
    }, 500); // Duration should match the fade-out duration
  };

  const handleHowToUseComplete = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowMenu(true);
      setIsFading(false);
    }, 500);
  };

  useEffect(() => {
    let interval;
    
    if (isHoveringLeft) {
      interval = setInterval(() => {
        setActiveCardIndex((prevIndex) => 
          prevIndex > 0 ? prevIndex - 1 : menuCards.length - 1
        );
      }, 1000); // Change slide every second when hovering left
    } else if (isHoveringRight) {
      interval = setInterval(() => {
        setActiveCardIndex((prevIndex) => 
          (prevIndex + 1) % menuCards.length
        );
      }, 1000); // Change slide every second when hovering right
    }
    
    return () => clearInterval(interval);
  }, [isHoveringLeft, isHoveringRight, menuCards.length]);

  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        body::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .carousel-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .carousel-nav {
          position: absolute;
          height: 100%;
          width: 150px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s ease;
        }

        .carousel-nav:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .carousel-nav-left {
          left: 0;
          cursor: w-resize;
        }

        .carousel-nav-right {
          right: 0;
          cursor: e-resize;
        }

        .carousel-indicator {
          position: absolute;
          bottom: 20px;
          display: flex;
          gap: 10px;
        }

        .indicator-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          transition: background-color 0.3s ease;
        }

        .indicator-dot.active {
          background-color: rgba(255, 255, 255, 0.9);
        }
      `}</style>

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
              initialWidth={2}
              initialHeight={2}
              initialDepth={2}
              follow_mouse={true}
              // auto_rotate={true}
            />
          </Canvas>
        </div>
      </div>
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
      <BluetoothScanner />
      <SystemOverview />

      <div className="flex items-center justify-center h-screen px-4">
        {!signalCompleted ? (
          <div
            className={`transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}
            style={{
              transition: "opacity 0.5s ease-out",
            }}
          >
            <GlassCard
              heading="Welcome !"
              description={
                <>
                  Introducing VISUM, your Interactive Kiosk System designed by Frushion to
                  elevate your skincare journey. Let us guide you with
                  personalized solutions for all your skincare needs.
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
              onButtonClick={handleSignalComplete}
            />
          </div>
        ) : !showMenu ? (
          <div
            className={`transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`}
            style={{
              transition: "opacity 0.5s ease-out",
            }}
          >
            <GlassCard
              heading="How to Use"
              description={
                <>
                  1. Enjoy a seamless gesture-based experience—simply use your
                  hands to navigate. <br />
                  2. Snap a photo of your face on the next screen, and we'll
                  analyze it to provide tailored skincare recommendations.{" "}
                  <br />
                  3. Connect with our Virtual Assistant for personalized
                  guidance. <br />
                </>
              }
              textSize="text-[50pt]"
              textSize2="text-[20pt]"
              boxWidth="w-[600px]"
              boxHeight="h-[550px]"
              tilt={true}
              centerText={true}
              buttonText="Explore Options"
              showButton={true}
              onButtonClick={handleHowToUseComplete}
            />
          </div>
        ) : (
          <div 
            className={`carousel-container transition-opacity duration-500 ${isFading ? "opacity-0" : "opacity-100"}`} 
            style={{ transition: "opacity 0.5s ease-out" }}
          >
            {/* Left navigation area */}
            <div 
              className="carousel-nav carousel-nav-left"
              onMouseEnter={() => setIsHoveringLeft(true)}
              onMouseLeave={() => setIsHoveringLeft(false)}
            >
              {isHoveringLeft && (
                <div className="text-white text-4xl opacity-50">
                  &#8249;
                </div>
              )}
            </div>

            {/* Active card with animation */}
            <div style={{ 
              animation: "slideIn 0.5s ease-out", 
              position: "relative",
              zIndex: 5
            }}>
              <GlassCard
                heading={menuCards[activeCardIndex].heading}
                description={menuCards[activeCardIndex].description}
                textSize="text-[40pt]"
                textSize2="text-[18pt]"
                boxWidth="w-[550px]"
                boxHeight="h-[450px]"
                tilt={true}
                centerText={true}
                showButton={true}
                buttonText={menuCards[activeCardIndex].buttonText}
                onButtonClick={menuCards[activeCardIndex].onButtonClick}
              />
            </div>

            {/* Right navigation area */}
            <div 
              className="carousel-nav carousel-nav-right"
              onMouseEnter={() => setIsHoveringRight(true)}
              onMouseLeave={() => setIsHoveringRight(false)}
            >
              {isHoveringRight && (
                <div className="text-white text-4xl opacity-50">
                  &#8250;
                </div>
              )}
            </div>

            {/* Indicator dots */}
            <div className="carousel-indicator">
              {menuCards.map((_, index) => (
                <div 
                  key={index}
                  className={`indicator-dot ${index === activeCardIndex ? 'active' : ''}`}
                  onClick={() => setActiveCardIndex(index)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
