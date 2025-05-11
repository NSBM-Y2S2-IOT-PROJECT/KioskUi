"use client";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import Webcam from "react-webcam";
import { Inter, Instrument_Serif } from "next/font/google";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SERVER_ADDRESS from "config";

const instrumentSerif = Instrument_Serif({ weight: "400" });
const inter = Inter({ subsets: ["latin"] });

interface SkinParameters {
  color: string;
  texture: string;
}

interface Ingredient {
  name?: string;
  description?: string;
}

interface Product {
  name?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
}

interface RecommendationData {
  recommendations?: string;
  recommendation_description?: string;
  recommended_ingredients?: string[];
  ingredients?: Ingredient[];
  suggested_products?: string[];
  products?: Product[];
  links?: string[];
}

export default function Home() {
  const [scanCompleted, setScanCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [skinParameters, setSkinParameters] = useState<SkinParameters>({
    color: "",
    texture: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] =
    useState<RecommendationData | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productPreviews, setProductPreviews] = useState<
    Record<string, string>
  >({});
  const webcamRef = useRef<Webcam>(null);

  // Add videoConstraints for specifying the device
  const videoConstraints = {
    deviceId: "/dev/video1",
    width: 550,
    height: 320,
  };

  const ThreeCard = dynamic(() => import("../../components/ThreeCard"), {
    ssr: false,
  });

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // B key - Go back or start new scan
      if (event.key === "f5" || event.key === "F5") {
        if (selectedProduct) {
          setSelectedProduct(null);
        } else if (scanCompleted) {
          setScanCompleted(false);
        } else {
          handleBack();
        }
      }

      // S key - Start scan
      if ((event.key === "s" || event.key === "S") && !isLoading) {
        if (scanCompleted) {
          setScanCompleted(false);
        } else {
          setIsLoading(true);
          setTimeout(() => {
            handleScan();
          }, 1000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [scanCompleted, selectedProduct, isLoading]);

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

  // Function to parse recommendation data from various possible formats
  const parseRecommendationData = (data: any): RecommendationData => {
    const parsedData: RecommendationData = {};

    // Handle main recommendation text
    if (data.recommendation_description) {
      parsedData.recommendation_description = data.recommendation_description;
    } else if (data.recommendations) {
      parsedData.recommendation_description = data.recommendations;
    }

    // Handle ingredients
    if (data.ingredients && Array.isArray(data.ingredients)) {
      parsedData.ingredients = data.ingredients.map(
        (item: string | Ingredient) => {
          if (typeof item === "string") {
            const colonIndex = item.indexOf(":");
            if (colonIndex > 0) {
              return {
                name: item.substring(0, colonIndex).trim(),
                description: item.substring(colonIndex + 1).trim(),
              };
            }
            return { name: item, description: "" };
          }
          return item;
        },
      );
    } else if (
      data.recommended_ingredients &&
      Array.isArray(data.recommended_ingredients)
    ) {
      parsedData.ingredients = data.recommended_ingredients.map(
        (item: string) => {
          const colonIndex = item.indexOf(":");
          if (colonIndex > 0) {
            return {
              name: item.substring(0, colonIndex).trim(),
              description: item.substring(colonIndex + 1).trim(),
            };
          }
          return { name: item, description: "" };
        },
      );
    }

    // Handle products and their links
    if (data.products && Array.isArray(data.products)) {
      if (typeof data.products[0] === "string") {
        parsedData.products = data.products.map((item: string) => ({
          name: item,
          description: "",
        }));
      } else {
        parsedData.products = data.products;
      }

      // If links exist, associate them with products
      if (data.links && Array.isArray(data.links)) {
        // Make sure parsedData.products exists
        parsedData.products = parsedData.products || [];

        // If there are equal number of products and links, associate them
        if (parsedData.products.length === data.links.length) {
          parsedData.products = parsedData.products.map((product, index) => ({
            ...product,
            link: data.links[index],
          }));
        } else {
          // Otherwise, just keep the links separately
          parsedData.links = data.links;
        }
      }
    } else if (
      data.suggested_products &&
      Array.isArray(data.suggested_products)
    ) {
      parsedData.products = data.suggested_products.map((item: string) => ({
        name: item,
        description: "",
      }));

      // If links exist, associate them with suggested products
      if (data.links && Array.isArray(data.links)) {
        if (
          parsedData.products &&
          parsedData.products.length === data.links.length
        ) {
          parsedData.products = parsedData.products.map((product, index) => ({
            ...product,
            link: data.links[index],
          }));
        } else {
          parsedData.links = data.links;
        }
      }
    } else if (data.links && Array.isArray(data.links)) {
      // If only links exist without products
      parsedData.links = data.links;
    }

    return parsedData;
  };

  // Function to fetch product preview images from the product URLs
  const fetchProductPreview = async (url: string) => {
    try {
      // This would ideally call a backend service that fetches meta tags
      // For now, we'll just return a placeholder image
      return "/product-placeholder.jpg";
    } catch (error) {
      console.error("Error fetching product preview:", error);
      return null;
    }
  };

  // Fetch product previews when recommendations change
  useEffect(() => {
    const fetchPreviews = async () => {
      if (recommendations?.products) {
        const previewsObj: Record<string, string> = {};

        for (const product of recommendations.products) {
          if (product.link) {
            const previewUrl = await fetchProductPreview(product.link);
            if (previewUrl) {
              previewsObj[product.link] = previewUrl;
            }
          }
        }

        setProductPreviews(previewsObj);
      }
    };

    if (recommendations) {
      fetchPreviews();
    }
  }, [recommendations]);

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const imageSrc = captureImage();
      if (!imageSrc) {
        console.error("Failed to capture image from webcam");
        return;
      }
  
      const base64Data = imageSrc.split(",")[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob(),
      );
  
      const formData = new FormData();
      formData.append("image", blob, "skin_image.jpg");
  
      // Step 2: Send image for analysis
      const analysisResponse = await axios.post(
        `${SERVER_ADDRESS}/data/image_check`,
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
  
      // Hide camera UI and show throbber
      setActiveTab("loading");
  
      // Step 3: Get recommendations based on analysis
      const recommendationResponse = await axios.get(
        `${SERVER_ADDRESS}/data/get_recommendations/${skin_color}/${texture}`,
      );
  
      // Parse and set recommendations data
      const parsedRecommendations = parseRecommendationData(
        recommendationResponse.data,
      );
      setRecommendations(parsedRecommendations);
  
      // Complete scan process
      setScanCompleted(true);
    } catch (error) {
      console.error("Error during skin analysis:", error);
      alert("An error occurred during skin analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        <div className={`relative z-10 ${inter.className} w-full`}>
          {scanCompleted && recommendations ? (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-[20px] border border-[rgba(255,255,255,0.18)] p-8 m-4 mx-auto flex flex-col shadow-xl overflow-y-auto"
                style={{
                  height: "calc(100vh - 120px)",
                  width: "calc(100vw - 40px)",
                  borderRadius: "1.5rem",
                }}
              >
                {selectedProduct ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mr-4 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                          onClick={() => setSelectedProduct(null)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </motion.button>
                        <h2 className="text-3xl font-semibold text-white/90">
                          Product Details
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100%-70px)]">
                      <div className="bg-white/10 rounded-2xl p-6 flex items-center justify-center overflow-hidden">
                        {selectedProduct.link &&
                        productPreviews[selectedProduct.link] ? (
                          <img
                            src={productPreviews[selectedProduct.link]}
                            alt={selectedProduct.name || "Product Image"}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-600/20 rounded-xl">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-24 w-24 text-white/40"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white/10 rounded-2xl p-6"
                        >
                          <h3 className="text-3xl font-semibold text-white/90 mb-2">
                            {selectedProduct.name}
                          </h3>
                          {selectedProduct.description && (
                            <p className="text-white/70 text-lg mt-4">
                              {selectedProduct.description}
                            </p>
                          )}
                          {!selectedProduct.description && (
                            <p className="text-white/60 italic mt-4">
                              No description available for this product.
                            </p>
                          )}
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white/10 rounded-2xl p-6"
                        >
                          <h3 className="text-xl font-medium text-white/90 mb-4">
                            About This Product
                          </h3>
                          <p className="text-white/70">
                            This product has been recommended based on your skin
                            analysis results:
                          </p>
                          <ul className="mt-4 space-y-2 text-white/80">
                            <li className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-green-400 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Skin Color: {skinParameters.color}</span>
                            </li>
                            <li className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-green-400 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Texture: {skinParameters.texture}</span>
                            </li>
                          </ul>
                        </motion.div>

                        {selectedProduct.link && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6"
                          >
                            <a
                              href={selectedProduct.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-lg"
                            >
                              <div className="flex items-center justify-center">
                                <span className="mr-2">View Product</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                              </div>
                            </a>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-8 h-full overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-semibold text-white/90"
                      >
                        <span className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 mr-3 text-indigo-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Analysis Results
                        </span>
                      </motion.h2>
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-white/90 flex items-center"
                        onClick={() => setScanCompleted(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Back to Camera
                      </motion.button>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-indigo-500/20 rounded-full mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-indigo-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-white/90">
                            Skin Analysis
                          </h3>
                        </div>
                        <div className="text-white/80 text-md space-y-3 ml-2">
                          <p className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-indigo-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                            <span className="font-semibold mr-2">
                              Skin Color:
                            </span>{" "}
                            <span className="bg-white/10 px-2 py-1 rounded-md">
                              {skinParameters.color}
                            </span>
                          </p>
                          <p className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-indigo-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-semibold mr-2">Texture:</span>{" "}
                            <span className="bg-white/10 px-2 py-1 rounded-md">
                              {skinParameters.texture}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="p-3 bg-purple-500/20 rounded-full mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-purple-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-white/90">
                            Recommendations
                          </h3>
                        </div>
                        <p className="text-white/80 text-md leading-relaxed">
                          {recommendations.recommendation_description ||
                            recommendations.recommendations}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {recommendations.ingredients &&
                        recommendations.ingredients.length > 0 && (
                          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center mb-6">
                              <div className="p-3 bg-blue-500/20 rounded-full mr-3">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 text-blue-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                                </svg>
                              </div>
                              <h3 className="text-xl font-semibold text-white/90">
                                Recommended Ingredients
                              </h3>
                            </div>
                            <ul className="space-y-3 text-white/80">
                              {recommendations.ingredients.map(
                                (ingredient: Ingredient, index: number) => (
                                  <motion.li
                                    key={index}
                                    className="flex bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                  >
                                    <span className="flex items-center justify-center bg-blue-500/20 h-7 w-7 rounded-full text-blue-300 mr-3">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <span className="font-medium text-white/90">
                                        {ingredient.name}
                                      </span>
                                      {ingredient.description && (
                                        <p className="text-sm text-white/60 mt-1">
                                          {ingredient.description}
                                        </p>
                                      )}
                                    </div>
                                  </motion.li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {recommendations.products &&
                        recommendations.products.length > 0 && (
                          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center mb-6">
                              <div className="p-3 bg-emerald-500/20 rounded-full mr-3">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 text-emerald-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <h3 className="text-xl font-semibold text-white/90">
                                Suggested Products
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {recommendations.products.map(
                                (product: Product, index: number) => (
                                  <motion.div
                                    key={index}
                                    className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => setSelectedProduct(product)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                  >
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg flex items-center justify-center mr-3">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-6 w-6 text-emerald-400"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white/90 mb-1">
                                          {product.name}
                                        </p>
                                        {product.description && (
                                          <p className="text-sm text-white/60 truncate">
                                            {product.description.length > 60
                                              ? `${product.description.substring(0, 60)}...`
                                              : product.description}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex-shrink-0">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-5 w-5 text-white/60"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  </motion.div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </motion.div>

                    {recommendations.links &&
                      recommendations.links.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-gradient-to-br from-orange-600/20 to-amber-600/20 p-6 rounded-2xl shadow-lg"
                        >
                          <div className="flex items-center mb-6">
                            <div className="p-3 bg-orange-500/20 rounded-full mr-3">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-orange-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white/90">
                              Additional Product Links
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {recommendations.links.map(
                              (link: string, index: number) => (
                                <motion.a
                                  key={index}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center bg-white/5 p-3 rounded-xl hover:bg-white/15 transition-all text-blue-300 hover:text-blue-400 group"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 + index * 0.05 }}
                                >
                                  <div className="flex-shrink-0 p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors mr-3">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 text-orange-400"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                  </div>
                                  <span className="truncate">
                                    {
                                      link
                                        .replace(/^https?:\/\//, "")
                                        .split("/")[0]
                                    }
                                  </span>
                                </motion.a>
                              ),
                            )}
                          </div>
                        </motion.div>
                      )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex justify-center pt-4 pb-8"
                    >
                      <motion.button
                        className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                        onClick={() => setScanCompleted(false)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                          New Scan
                        </div>
                      </motion.button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-[20px] rounded-2xl border border-[rgba(255,255,255,0.18)] p-6 w-[550px] h-[600px] flex flex-col shadow-xl mx-auto"
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
        videoConstraints={videoConstraints}
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

              {activeTab === "loading" && (
                <div className="flex flex-col items-center justify-center space-y-10 h-full">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
                    <h2 className="text-xl font-medium text-white/90 mb-2">
                      Generating Recommendations
                    </h2>
                    <p className="text-white/60 text-center">
                      Please wait while we analyze your skin data and prepare personalized recommendations.
                    </p>
                  </div>
                  
                  <div className="bg-white/10 p-6 rounded-xl w-full max-w-md">
                    <h3 className="text-lg font-medium text-white/80 mb-4">Skin Analysis Results</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-indigo-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-white/60 text-sm">Skin Color</span>
                          <p className="text-white/90 font-medium">{skinParameters.color}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-purple-500/20 p-2 rounded-lg mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-purple-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="text-white/60 text-sm">Texture</span>
                          <p className="text-white/90 font-medium">{skinParameters.texture}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                      <label className="text-white/80">
                        Lighting Correction
                      </label>
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
                          <input
                            type="radio"
                            name="lighting"
                            className="mr-2"
                          />
                          <span className="text-white/90">Manual</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-white/80">
                        Analysis Precision
                      </label>
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
          )}
        </div>
      </div>

      <SystemOverview />
    </>
  );
}
