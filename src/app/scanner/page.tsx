"use client";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import SystemOverview from "@/components/systemStat";
import { Canvas } from "@react-three/fiber";
import Webcam from "react-webcam";
import { Inter, Instrument_Serif } from "next/font/google";
import Header from "@/components/Header";
import BluetoothCardSave from "@/components/bluetoothCardSave";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import GlassCard from "@/components/glscard";
import Glsbutton from "@/components/glsbutton";
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

export default function Scanner() {
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
  const [activeCoverFlowIndex, setActiveCoverFlowIndex] = useState(0);
  const webcamRef = useRef<Webcam>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [isHoverEnabled, setIsHoverEnabled] = useState(true);
  const [isHoveringLeft, setIsHoveringLeft] = useState(false);
  const [isHoveringRight, setIsHoveringRight] = useState(false);

  const coverFlowSections = [
    { id: "skin-analysis", title: "Skin Analysis" },
    { id: "ingredients", title: "Ingredients" },
    { id: "products", title: "Products" },
    { id: "recommendations", title: "Recommendations" },
  ].filter((section) => {
    if (section.id === "ingredients") {
      return (
        recommendations?.ingredients && recommendations.ingredients.length > 0
      );
    }
    if (section.id === "products") {
      return (
        recommendations?.products && recommendations.products.length > 0
      );
    }
    return true;
  });

  const videoConstraints = {
    deviceId: "/dev/video1",
    width: 550,
    height: 320,
  };

  const ThreeCard = dynamic(() => import("../../components/ThreeCard"), {
    ssr: false,
  });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "f5" || event.key === "F5") {
        if (selectedProduct) {
          setSelectedProduct(null);
        } else if (scanCompleted) {
          setScanCompleted(false);
        } else {
          handleBack();
        }
      }

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

      if (scanCompleted && !selectedProduct) {
        if (event.key === "ArrowLeft") {
          setActiveCoverFlowIndex((prev) =>
            prev > 0 ? prev - 1 : coverFlowSections.length - 1,
          );
        } else if (event.key === "ArrowRight") {
          setActiveCoverFlowIndex((prev) =>
            prev < coverFlowSections.length - 1 ? prev + 1 : 0,
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [scanCompleted, selectedProduct, isLoading, coverFlowSections.length, hoverTimer]);

  useEffect(() => {
    let interval;
    
    if (isHoveringLeft) {
      interval = setInterval(() => {
        setActiveCoverFlowIndex((prevIndex) => 
          prevIndex > 0 ? prevIndex - 1 : coverFlowSections.length - 1
        );
      }, 1000);
    } else if (isHoveringRight) {
      interval = setInterval(() => {
        setActiveCoverFlowIndex((prevIndex) => 
          (prevIndex + 1) % coverFlowSections.length
        );
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isHoveringLeft, isHoveringRight, coverFlowSections.length]);

  const navigateCoverFlow = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setActiveCoverFlowIndex((prev) =>
        prev > 0 ? prev - 1 : coverFlowSections.length - 1,
      );
    } else {
      setActiveCoverFlowIndex((prev) =>
        prev < coverFlowSections.length - 1 ? prev + 1 : 0,
      );
    }
  };

  const handleHoverNavigation = (direction: "prev" | "next") => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }

    if (isHoverEnabled) {
      const timer = setTimeout(() => {
        navigateCoverFlow(direction);
        setIsHoverEnabled(false);
        setTimeout(() => {
          setIsHoverEnabled(true);
        }, 1000);
      }, 300);
      setHoverTimer(timer);
    }
  };

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

  const parseRecommendationData = (data: any): RecommendationData => {
    const parsedData: RecommendationData = {};

    if (data.recommendation_description) {
      parsedData.recommendation_description = data.recommendation_description;
    } else if (data.recommendations) {
      parsedData.recommendation_description = data.recommendations;
    }

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

    if (data.products && Array.isArray(data.products)) {
      if (typeof data.products[0] === "string") {
        parsedData.products = data.products.map((item: string) => ({
          name: item,
          description: "",
        }));
      } else {
        parsedData.products = data.products;
      }

      if (data.links && Array.isArray(data.links)) {
        parsedData.products = parsedData.products || [];
        if (parsedData.products.length === data.links.length) {
          parsedData.products = parsedData.products.map((product, index) => ({
            ...product,
            link: data.links[index],
          }));
        } else {
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
      parsedData.links = data.links;
    }

    return parsedData;
  };

  const fetchProductPreview = async (url: string) => {
    try {
      return "/product-placeholder.jpg";
    } catch (error) {
      console.error("Error fetching product preview:", error);
      return null;
    }
  };

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

      setSkinParameters({
        color: skin_color,
        texture: texture,
      });

      setActiveTab("loading");

      const recommendationResponse = await axios.get(
        `${SERVER_ADDRESS}/data/get_recommendations/${skin_color}/${texture}`,
      );

      const parsedRecommendations = parseRecommendationData(
        recommendationResponse.data,
      );
      setRecommendations(parsedRecommendations);

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

      <Header />
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
        <div className="absolute inset-0">
          <Canvas>
            <ThreeCard
              initialWidth={2}
              initialHeight={2}
              initialDepth={2}
              follow_mouse={true}
            />
          </Canvas>
        </div>
      </div>

      <SystemOverview />

      <div className="flex items-center justify-center h-screen px-4">
        {scanCompleted && recommendations ? (
          <div className="carousel-container">
            <div 
              className="carousel-nav carousel-nav-left"
              onMouseEnter={() => setIsHoveringLeft(true)}
              onMouseLeave={() => setIsHoveringLeft(false)}
              onClick={() => navigateCoverFlow("prev")}
            >
              {isHoveringLeft && (
                <div className="text-white text-4xl opacity-50">
                  ‹
                </div>
              )}
            </div>

            <div style={{ 
              animation: "slideIn 0.5s ease-out",
              position: "relative",
              zIndex: 5
            }}>
              <GlassCard
                heading={selectedProduct ? "Product Details" : "Analysis Results"}
                description={
                  selectedProduct ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/10 p-6 flex items-center justify-center overflow-hidden">
                          {selectedProduct.link &&
                          productPreviews[selectedProduct.link] ? (
                            <img
                              src={productPreviews[selectedProduct.link]}
                              alt={selectedProduct.name || "Product Image"}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-600/20">
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
                          <div className="bg-white/10 p-6">
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
                          </div>

                          <div className="bg-white/10 p-6">
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
                          </div>

                          {selectedProduct.link && (
                            <a
                              href={selectedProduct.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-lg"
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
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Glsbutton
                          text="Back to Results"
                          onClick={() => setSelectedProduct(null)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <BluetoothCardSave
                          Analysis={skinParameters}
                          Ingredients={recommendations?.ingredients}
                          Products={recommendations?.products}
                          Recommendations={recommendations?.recommendation_description}
                          savedAt={new Date().toISOString()}
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeCoverFlowIndex}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          {activeCoverFlowIndex === 0 && (
                            <div className="space-y-6">
                              <div className="text-center">
                                <h3 className={`text-2xl font-semibold text-white/90 ${instrumentSerif.className}`}>
                                  Skin Analysis
                                </h3>
                              </div>
                              <div className="text-white/80 text-lg space-y-5 text-center">
                                <div className="flex items-center justify-center flex-col">
                                  <div className="bg-white/10 p-4 mb-3">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-12 w-12 text-indigo-400"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                    </svg>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <span className="font-semibold block text-xl mb-2">Skin Color</span>
                                      <span className="bg-white/10 px-4 py-2 text-xl">
                                        {skinParameters.color}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-semibold block text-xl mb-2">Texture</span>
                                      <span className="bg-white/10 px-4 py-2 text-xl">
                                        {skinParameters.texture}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeCoverFlowIndex === 3 && (
                            <div className="space-y-6">
                              <div className="text-center">
                                <h3 className="text-2xl font-semibold text-white/90">
                                  Recommendations
                                </h3>
                              </div>
                              <p className="text-white/80 text-lg leading-relaxed text-center">
                                {recommendations.recommendation_description ||
                                  recommendations.recommendations}
                              </p>
                            </div>
                          )}

                          {activeCoverFlowIndex === 1 && recommendations.ingredients && recommendations.ingredients.length > 0 && (
                            <div className="space-y-6">
                              <div className="text-center">
                                <h3 className="text-2xl font-semibold text-white/90">
                                  Recommended Ingredients
                                </h3>
                              </div>
                              <ul className="space-y-4 text-white/80 max-h-[400px] overflow-y-auto pr-2">
                                {recommendations.ingredients.map(
                                  (ingredient: Ingredient, index: number) => (
                                    <motion.li
                                      key={index}
                                      className="flex bg-white/5 p-4 hover:bg-white/10 transition-colors"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.1 + index * 0.05 }}
                                    >
                                      <span className="flex items-center justify-center bg-blue-500/20 h-8 w-8 text-blue-300 mr-3">
                                        {index + 1}
                                      </span>
                                      <div>
                                        <span className="font-medium text-white/90 text-lg">
                                          {ingredient.name}
                                        </span>
                                        {ingredient.description && (
                                          <p className="text-white/60 mt-1">
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

                          {activeCoverFlowIndex === 2 && recommendations.products && recommendations.products.length > 0 && (
                            <div className="space-y-6">
                              <div className="text-center">
                                <h3 className="text-2xl font-semibold text-white/90">
                                  Scan QR Code for Products
                                </h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[450px] overflow-y-auto pr-2">
                                {recommendations.products.map(
                                  (product: Product, index: number) => (
                                    <motion.div
                                      key={index}
                                      className="bg-white/5 p-4 hover:bg-white/15 transition-all cursor-pointer"
                                      onClick={() => setSelectedProduct(product)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.1 + index * 0.05 }}
                                    >
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-24 w-24 bg-white flex items-center justify-center mr-4">
                                          <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                                              JSON.stringify({
                                                name: product.name,
                                                description: product.description?.substring(0, 100),
                                                link: product.link || `product:${product.name}`,
                                                recommendedFor: {
                                                  skinColor: skinParameters.color,
                                                  texture: skinParameters.texture
                                                }
                                              })
                                            )}`}
                                            alt={`QR code for ${product.name}`}
                                            className="h-20 w-20"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-white/90 text-lg mb-1">
                                            {product.name}
                                          </p>
                                          {product.description && (
                                            <p className="text-white/60">
                                              {product.description.length > 80
                                                ? `${product.description.substring(0, 80)}...`
                                                : product.description}
                                            </p>
                                          )}
                                          <p className="text-emerald-400 text-sm mt-2">
                                            Scan QR code to view details
                                          </p>
                                        </div>
                                        <div className="flex-shrink-0 ml-2">
                                          <div className="p-2 bg-white/10 hover:bg-white/20 transition-colors">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-6 w-6 text-white/80"
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
                                      </div>
                                    </motion.div>
                                  ),
                                )}
                              </div>
                              <div className="mt-4 text-center text-white/60 text-sm">
                                Use your phone's camera to scan the QR code for detailed product information
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      <div className="mt-3 text-center text-white/50 text-sm">
                        Move the cursor to the left/right to navigate through the carousel...
                      </div>
                    </div>
                  )}
                textSize="text-[40pt]"
                textSize2="text-[18pt]"
                boxWidth="w-[1000px]"
                boxHeight="h-[650px]"
                tilt={true}
                centerText={true}
                showButton={false}
              />
            </div>

            <div 
              className="carousel-nav carousel-nav-right"
              onMouseEnter={() => setIsHoveringRight(true)}
              onMouseLeave={() => setIsHoveringRight(false)}
              onClick={() => navigateCoverFlow("next")}
            >
              {isHoveringRight && (
                <div className="text-white text-4xl opacity-50">
                  ›
                </div>
              )}
            </div>

            <div className="carousel-indicator">
              {coverFlowSections.map((_, index) => (
                <div 
                  key={index}
                  className={`indicator-dot ${index === activeCoverFlowIndex ? 'active' : ''}`}
                  onClick={() => setActiveCoverFlowIndex(index)}
                />
              ))}
            </div>
          </div>
        ) : (
          <GlassCard
            heading={activeTab === "scan" ? "Skin Scanner" : activeTab === "loading" ? "Generating Recommendations" : "Scanner Settings"}
            description={
              activeTab === "scan" ? (
                <>
                  <div className="relative overflow-hidden mb-6 border border-white/0 h-[290px]">
                    <Webcam
                      audio={false}
                      height={200}
                      width={550}
                      screenshotFormat="image/jpeg"
                      className="object-cover"
                      ref={webcamRef}
                      videoConstraints={videoConstraints}
                    />
                    <div className="absolute inset-0 border-4 border-white/30 pointer-events-none"></div>
                    <div className={`absolute top-3 right-3 px-2 py-1 bg-black/50 text-xs text-white/80 ${instrumentSerif.className}`}>
                      Live Camera
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-white/10 p-3">
                      <p className={`text-white/90 text-m text-white font-bold mb-4 ${instrumentSerif.className}`}>
                        Position your face in the camera frame and click "Scan"
                        button on the Kiosk to begin skin analysis. Make sure
                        your face is well-lit and centered in the frame for
                        best results.
                      </p>
                    </div>
                    {isLoading && (
                      <div className="flex justify-center items-center">
                        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                        <span className="ml-2 text-white/80">
                          Please wait while our local AI Assistant
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
                    <Glsbutton
                      text={"Back"}
                      onClick={handleBack}
                    />
                    <Glsbutton
                      text={isLoading ? "Scanning..." : "Start Scan"}
                      onClick={handleScan}
                      disabled={isLoading}
                    />
                  </div>
                </>
              ) : activeTab === "loading" ? (
                <div className={`flex flex-col items-center justify-center space-y-10 ${instrumentSerif.className}`}>
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
                    <p className="text-white/60 text-center">
                      Please wait while we analyze your skin data and prepare
                      personalized recommendations.
                    </p>
                  </div>
                  <div className="bg-white/10 p-6 w-full max-w-md">
                    <h3 className="text-lg font-medium text-white/80 mb-4">
                      Skin Analysis Results
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="bg-indigo-500/20 p-2 mr-3">
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
                          <span className="text-white/60 text-sm">
                            Skin Color
                          </span>
                          <p className="text-white/90 font-medium">
                            {skinParameters.color}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-purple-950/20 p-2 mr-3">
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
                          <p className="text-white/90 font-medium">
                            {skinParameters.texture}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 p-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-white/80">Camera Resolution</label>
                      <select className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white/90">
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
                      <select className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white/90">
                        <option>Standard</option>
                        <option>High</option>
                        <option>Maximum</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            }
            textSize="text-[40pt]"
            textSize2="text-[18pt]"
            boxWidth="w-[600px]"
            boxHeight="h-[600px]"
            tilt={true}
            centerText={true}
            showButton={false}
          />
        )}
      </div>
    </>
  );
}