"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import Webcam from "react-webcam";
import { Inter, Instrument_Serif } from "next/font/google";
import Glsbutton from "@/components/glsbutton";
import Image from "next/image";
import { motion } from "framer-motion";
import axios from "axios";

const instrumentSerif = Instrument_Serif({ weight: "400" });
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [scanCompleted, setScanCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [skinParameters, setSkinParameters] = useState({
    color: "",
    texture: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const webcamRef = useRef(null);

  const ThreeCard = dynamic(() => import("../../components/ThreeCard"), {
    ssr: false,
  });

  const handleBack = () => {
    window.location.href = "/";
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      return imageSrc;
    }
    return null;
  };

  const handleScan = async () => {
    setIsLoading(true);
    try {
      // Step 1: Capture image from webcam
      const imageSrc = captureImage();
      if (!imageSrc) {
        console.error("Failed to capture image from webcam");
        return;
      }

      // Convert base64 to blob
      const base64Data = imageSrc.split(",")[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob(),
      );

      // Create FormData and append image
      const formData = new FormData();
      formData.append("image", blob, "skin_image.jpg");

      // Step 2: Send image for analysis
      const analysisResponse = await axios.post(
        "http://10.42.0.53:5000/data/image_check",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      const { skin_color, texture } = analysisResponse.data;

      // Update skin parameters
      setSkinParameters({
        color: skin_color,
        texture: texture,
      });

      // Step 3: Get recommendations based on analysis
      const recommendationResponse = await axios.get(
        `http://10.42.0.53:5000/data/get_recommendations/${skin_color}/${texture}`,
      );

      // Set recommendations data
      // console.log(recommendationResponse.data);
      setRecommendations(recommendationResponse.data);

      // Complete scan process
      setScanCompleted(true);
    } catch (error) {
      console.error("Error during skin analysis:", error);
      alert("An error occurred during skin analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleParameterChange = (parameter: string, value: string) => {
    setSkinParameters((prev) => ({
      ...prev,
      [parameter]: value,
    }));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 w-full h-16 bg-black/30 backdrop-blur-lg z-40 flex items-center px-6"
      >
        <div className="flex items-center gap-4">
          <Image
            src="/nav.svg"
            alt="Navigation Icon"
            width={40}
            height={40}
            className="hover:scale-110 transition-transform cursor-pointer"
          />
          <h1 className={`text-xl text-white/90 font-light ${inter.className}`}>
            Skin Analysis System
          </h1>
        </div>
      </motion.div>

      <div className="absolute w-screen h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Canvas>
            <ThreeCard
              initialWidth={10}
              initialHeight={10}
              initialDepth={10}
              auto_rotate={true}
            />
          </Canvas>
        </div>
      </div>

      <div className="flex flex-row items-center justify-center h-screen w-screen">
        <div className={`relative z-10 flex gap-6 ${inter.className}`}>
          {scanCompleted && recommendations && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-[20px] rounded-2xl border border-[rgba(255,255,255,0.18)] p-8 w-[500px] h-[600px] flex flex-col justify-between shadow-xl overflow-y-auto"
            >
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white/90">
                  Analysis Results
                </h2>

                <div className="space-y-4">
                  <div className="bg-white/10 p-4 rounded-xl">
                    <h3 className="text-lg mb-2 text-white/80">
                      Skin Analysis
                    </h3>
                    <div className="text-white/70 text-sm">
                      <p>
                        <span className="font-semibold">Skin Color:</span>{" "}
                        {skinParameters.color}
                      </p>
                      <p>
                        <span className="font-semibold">Texture:</span>{" "}
                        {skinParameters.texture}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 p-4 rounded-xl">
                    <h3 className="text-lg mb-2 text-white/80">
                      Recommendations
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {recommendations.recommendation_description}
                    </p>

                    {recommendations.ingredients &&
                      recommendations.ingredients.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-semibold text-white/80">
                            Recommended Ingredients:
                          </h4>
                          <ul className="list-disc list-inside text-white/70 text-xs mt-1">
                            {recommendations.ingredients.map(
                              (ingredient, index) => (
                                <li key={index}>
                                  <span className="font-medium">
                                    {ingredient.name}
                                  </span>
                                  : {ingredient.description}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                    {recommendations.products &&
                      recommendations.products.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-semibold text-white/80">
                            Suggested Products:
                          </h4>
                          <ul className="list-disc list-inside text-white/70 text-xs mt-1">
                            {recommendations.products.map((product, index) => (
                              <li key={index}>
                                <span className="font-medium">
                                  {product.name}
                                </span>
                                : {product.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>

                  {recommendations.links &&
                    recommendations.links.length > 0 && (
                      <div className="bg-white/10 p-4 rounded-xl">
                        <h3 className="text-sm font-semibold text-white/80">
                          Product Links
                        </h3>
                        <div className="mt-2 space-y-1">
                          {recommendations.links.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-300 hover:text-blue-400 text-xs truncate"
                            >
                              {link}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  onClick={() => setScanCompleted(false)}
                >
                  New Scan
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-[20px] rounded-2xl border border-[rgba(255,255,255,0.18)] p-6 w-[550px] h-[600px] flex flex-col shadow-xl"
          >
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === "scan"
                    ? "bg-white/20 text-white"
                    : "bg-transparent text-white/60 hover:text-white/80"
                }`}
                onClick={() => setActiveTab("scan")}
              >
                Scan
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === "settings"
                    ? "bg-white/20 text-white"
                    : "bg-transparent text-white/60 hover:text-white/80"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>

            {activeTab === "scan" && (
              <>
                <div className="relative rounded-xl overflow-hidden mb-6 border border-white/20 h-[320px]">
                  <Webcam
                    audio={false}
                    height={320}
                    width={550}
                    screenshotFormat="image/jpeg"
                    className="object-cover"
                    ref={webcamRef}
                  />
                  <div className="absolute inset-0 border-4 border-white/30 rounded-xl pointer-events-none"></div>

                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded-md text-xs text-white/80">
                    Live Camera
                  </div>
                </div>

                <div className="space-y-5 flex-grow">
                  <div className="bg-white/10 p-3 rounded-xl">
                    <p className="text-white/90 text-sm">
                      Position your face in the camera frame and click "Start
                      Scan" to begin skin analysis. Make sure your face is
                      well-lit and centered in the frame for best results.
                    </p>
                  </div>

                  {isLoading && (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      <span className="ml-2 text-white/80">
                        Analyzing skin characteristics...
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
                  <button
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-white/90"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <button
                    className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                    onClick={handleScan}
                    disabled={isLoading}
                  >
                    {isLoading ? "Scanning..." : "Start Scan"}
                  </button>
                </div>
              </>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6 p-2">
                <h2 className="text-xl font-medium text-white/90">
                  Scanner Settings
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-white/80">Camera Resolution</label>
                    <select className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/90">
                      <option>HD (720p)</option>
                      <option>Full HD (1080p)</option>
                      <option>4K (2160p)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/80">Lighting Correction</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="lighting"
                          className="mr-2"
                          defaultChecked
                        />
                        <span className="text-white/90">Auto</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="lighting" className="mr-2" />
                        <span className="text-white/90">Manual</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/80">Analysis Precision</label>
                    <select className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/90">
                      <option>Standard</option>
                      <option>High</option>
                      <option>Maximum</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <SystemOverview />
    </>
  );
}
