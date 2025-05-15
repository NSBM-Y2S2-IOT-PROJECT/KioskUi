"use client";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import Header from "@/components/Header";
import { useState, useEffect, useRef } from "react";
import { Instrument_Serif, Instrument_Sans } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { FaBluetooth, FaSearch, FaHistory } from 'react-icons/fa';
import Glsbutton from "../../components/glsbutton";

const instrumentSerif = Instrument_Serif({ 
  weight: "400",
  subsets: ["latin"]
});

const instrumentSans = Instrument_Sans({
  weight: "400",
  subsets: ["latin"]
});

const ThreeCard = dynamic(() => import("../../components/ThreeCard"), {
    ssr: false,
  });

interface BluetoothDevice {
  address: string;
  name: string;
  rssi: number;
  lastSeen?: number; // Timestamp when the device was last seen
}

interface BluetoothResponse {
  device: BluetoothDevice;
  found: boolean;
}

interface DeviceStatistics {
  total: number;
  strong: number;
  medium: number;
  weak: number;
}

export default function BluetoothInteractions() {

  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [stats, setStats] = useState<DeviceStatistics>({
    total: 0,
    strong: 0,
    medium: 0,
    weak: 0
  });
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [manualScan, setManualScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  
  // New state for interaction history
  const [showingInteractions, setShowingInteractions] = useState(false);
  const [interactionHistory, setInteractionHistory] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  
  // New state for carousel navigation
  const [currentInteractionIndex, setCurrentInteractionIndex] = useState(0);
  
  // Hover navigation state
  const [hoverNavigation, setHoverNavigation] = useState<'left' | 'right' | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Device timeout in milliseconds (5 seconds)
  const DEVICE_TIMEOUT = 5000;

  const scanForDevices = async () => {
    try {
      setScanning(true);
      setError(null);
      
      if (manualScan) {
        // Start the progress animation
        setScanProgress(0);
        progressRef.current = setInterval(() => {
          setScanProgress(prev => {
            if (prev >= 100) {
              if (progressRef.current) clearInterval(progressRef.current);
              return 100;
            }
            return prev + 5;
          });
        }, 100);
      }
      
      const response = await fetch("http://localhost:5000/data/scan_bluetooth");
      const data: BluetoothResponse = await response.json();
      
      const currentTime = Date.now();
      
      setDevices(prevDevices => {
        // Create a copy of the current devices with updated lastSeen timestamps
        const updatedDevices = [...prevDevices];
        
        // If a device is found, update or add it
        if (data.found && data.device) {
          const deviceIndex = updatedDevices.findIndex(dev => dev.address === data.device.address);
          if (deviceIndex >= 0) {
            // Update existing device
            updatedDevices[deviceIndex] = {
              ...updatedDevices[deviceIndex],
              rssi: data.device.rssi,
              lastSeen: currentTime
            };
          } else {
            // Add new device
            updatedDevices.push({
              ...data.device,
              lastSeen: currentTime
            });
          }
        }
        
        // Filter out devices that haven't been seen recently
        return updatedDevices.filter(device => 
          device.lastSeen && (currentTime - device.lastSeen) < DEVICE_TIMEOUT
        );
      });
      
      if (manualScan) {
        // Clear interval when manual scan is complete
        if (progressRef.current) {
          clearInterval(progressRef.current);
          progressRef.current = null;
        }
        setScanProgress(100);
        // Reset manual scan mode after completion
        setTimeout(() => {
          setManualScan(false);
          setScanProgress(0);
        }, 1500);
      }
    } catch (err) {
      console.error("Error scanning for Bluetooth devices:", err);
      setError("Failed to scan for Bluetooth devices. Please check your connection to the server.");
      
      if (manualScan && progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
        setManualScan(false);
        setScanProgress(0);
      }
    } finally {
      setScanning(false);
    }
  };

  // Function to navigate to next interaction in the carousel
  const nextInteraction = () => {
    if (interactionHistory.length > 0) {
      setCurrentInteractionIndex(prev => 
        prev === interactionHistory.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Function to navigate to previous interaction in the carousel
  const prevInteraction = () => {
    if (interactionHistory.length > 0) {
      setCurrentInteractionIndex(prev => 
        prev === 0 ? interactionHistory.length - 1 : prev - 1
      );
    }
  };

  // Function to get signal strength description based on RSSI value
  const getSignalStrength = (rssi: number) => {
    if (rssi > -50) return { text: "Excellent", color: "text-green-400", level: "strong" };
    if (rssi > -65) return { text: "Good", color: "text-blue-400", level: "strong" };  
    if (rssi > -75) return { text: "Fair", color: "text-yellow-400", level: "medium" };
    return { text: "Poor", color: "text-red-400", level: "weak" };
  };

  // Function to get signal strength icon based on RSSI value
  const getSignalIcon = (rssi: number) => {
    const strength = getSignalStrength(rssi);
    
    return (
      <div className="flex flex-col items-center">
        <div className={`flex items-end h-5 space-x-1 ${strength.color}`}>
          <div className={`w-1 h-1 -sm ${rssi > -75 ? 'bg-current' : 'bg-white/30'}`}></div>
          <div className={`w-1 h-2 -sm ${rssi > -65 ? 'bg-current' : 'bg-white/30'}`}></div>
          <div className={`w-1 h-3 -sm ${rssi > -55 ? 'bg-current' : 'bg-white/30'}`}></div>
          <div className={`w-1 h-4 -sm ${rssi > -45 ? 'bg-current' : 'bg-white/30'}`}></div>
        </div>
        <span className={`text-xs mt-1 ${strength.color}`}>{strength.text}</span>
      </div>
    );
  };

  // Function to calculate statistics about devices
  const calculateStats = (deviceList: BluetoothDevice[]) => {
    const stats = {
      total: deviceList.length,
      strong: 0,
      medium: 0,
      weak: 0
    };
    
    deviceList.forEach(device => {
      const strength = getSignalStrength(device.rssi);
      if (strength.level === "strong") stats.strong++;
      else if (strength.level === "medium") stats.medium++;
      else stats.weak++;
    });
    
    setStats(stats);
  };

  // Filter devices based on search query
  useEffect(() => {
    const filtered = devices.filter(device => {
      const deviceName = (device.name || "Unknown Device").toLowerCase();
      const deviceAddress = device.address.toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return deviceName.includes(query) || deviceAddress.includes(query);
    });
    
    setFilteredDevices(filtered);
    calculateStats(filtered);
  }, [devices, searchQuery]);

  // Auto-scan every 3 seconds
  useEffect(() => {
    scanForDevices(); // Initial scan when component mounts
    
    const intervalId = setInterval(() => {
      if (!manualScan) { // Only auto-scan if not manually scanning
        scanForDevices();
      }
    }, 3000);
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(intervalId);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [manualScan]);

  // Additional cleanup interval to remove stale devices
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentTime = Date.now();
      setDevices(prevDevices => 
        prevDevices.filter(device => 
          device.lastSeen && (currentTime - device.lastSeen) < DEVICE_TIMEOUT
        )
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Clean up any hover navigation timers when component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearInterval(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, []);
  
  // Function to format the time last seen
  const formatTimeSince = (timestamp: number) => {
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    
    if (secondsAgo < 5) return "Just now";
    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    
    return "Over 1 minute ago";
  };
  
  const handleManualScan = () => {
    if (!scanning && !manualScan) {
      setManualScan(true);
      scanForDevices();
    }
  };

  // Function to search for interactions by device MAC address
  const searchInteractions = async (device: BluetoothDevice) => {
    try {
      setLoadingInteractions(true);
      setSelectedDevice(device);
      setShowingInteractions(true);
      
      const response = await fetch("http://localhost:5000/data/search_interactions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: device.address
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(data.results);
        setInteractionHistory(data.results);
      } else {
        console.error("Error fetching interaction history:", data.error);
        setError(`Failed to fetch interaction history: ${data.error}`);
        setInteractionHistory([]);
      }
    } catch (err) {
      console.error("Error searching for interactions:", err);
      setError("Failed to search for interaction history. Please check your connection to the server.");
      setInteractionHistory([]);
    } finally {
      setLoadingInteractions(false);
    }
  };

  // Function to close interaction history modal
  const closeInteractionHistory = () => {
    setShowingInteractions(false);
    setSelectedDevice(null);
    setInteractionHistory([]);
  };

  return (
    <main className="min-h-screen">
      <Header />
      
      {/* Background with 3D effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,127,255,0.3), transparent 70%)",
              filter: "blur(80px)",
              animation: "pulse 8s ease-in-out infinite",
            }}
          />
        </div>
        
        <Canvas>
          <ThreeCard
            initialWidth={2}
            initialHeight={2}
            initialDepth={2}
            // follow_mouse={false}
            auto_rotate={true}
            // topText="Bluetooth"
            // descriptiveText="Scanner"
          />
        </Canvas>
      </div>
      
      {/* Main content */}
      <div className={`container mx-auto pt-24 px-4 relative z-10 ${instrumentSerif.className}`}>
        {/* Header section with stats */}
        <div className="flex flex-col md:flex-row justify-between mb-8 items-start md:items-center">
          <div>
            <h1 className={`text-4xl text-white font-bold mb-2 ${instrumentSerif.className}`}
              style={{
                textShadow: `
                  0 0 10px rgba(0, 127, 255, 0.4),
                  0 0 20px rgba(0, 127, 255, 0.3),
                  0 0 30px rgba(0, 127, 255, 0.2)
                `
              }}
            >
              VISUM x YOU
            </h1>
            <p className="text-white/70 mb-4">
              Select your device to view past interactions with the system
            </p>
          </div>
          
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManualScan}
              disabled={scanning || manualScan}
              className={`bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-4 -lg flex items-center gap-2 ${(scanning || manualScan) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
            >
              {(scanning || manualScan) ? (
                <div className="w-5 h-5 border-t-2 border-t-white border-solid rounded-full animate-spin mr-2"></div>
              ) : (
                <FaBluetooth className="text-lg" />
              )}
              {(scanning || manualScan) ? 'Scanning...' : 'Manual Scan'}
            </motion.button>
            
            <div className="flex items-center">
              <button 
                onClick={() => setView('grid')} 
                className={`p-2 -l-lg ${view === 'grid' ? 'bg-white/20' : 'bg-black/20'} transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setView('list')} 
                className={`p-2 -r-lg ${view === 'list' ? 'bg-white/20' : 'bg-black/20'} transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/80" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and stats bar */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 -xl p-4 mb-6 flex flex-col md:flex-row justify-between gap-4">
          
          
          <div className="flex items-center gap-6 justify-center md:justify-start">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-xs text-white/60">Total</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-green-400">{stats.strong}</span>
              <span className="text-xs text-white/60">Strong</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-yellow-400">{stats.medium}</span>
              <span className="text-xs text-white/60">Medium</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-red-400">{stats.weak}</span>
              <span className="text-xs text-white/60">Weak</span>
            </div>
          </div>
        </div>
        
        {/* Manual scan progress bar */}
        {manualScan && (
          <div className="mb-6 bg-white/10 -full overflow-hidden">
            <div
              className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 -full transition-all duration-100"
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300 px-4 py-3 -lg mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        {/* No devices message */}
        {filteredDevices.length === 0 && !scanning && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 -xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-500/20 -full flex items-center justify-center mb-4">
              <FaBluetooth className="text-blue-400 text-3xl" />
            </div>
            <h3 className={`text-xl text-white mb-2 ${instrumentSerif.className}`}>No Bluetooth Devices Found</h3>
            <p className="text-white/60 max-w-md mb-6">
              Scanning for nearby Bluetooth devices. Make sure your Bluetooth devices are powered on and in range and you have opened the bluetooth menu on your device...
            </p>
            {/* <button
              onClick={handleManualScan}
              disabled={scanning || manualScan}
              className={`bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-6 -lg ${(scanning || manualScan) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
            >
              {(scanning || manualScan) ? 'Scanning...' : 'Scan Again'}
            </button> */}
          </div>
        )}
        
        {/* Device list */}
        {filteredDevices.length > 0 && (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredDevices.map((device) => (
              <motion.div
                key={device.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-white/10 backdrop-blur-md border border-white/20 -xl overflow-hidden hover:bg-white/15 transition-all cursor-pointer ${showDetails === device.address ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setShowDetails(prev => prev === device.address ? null : device.address)}
              >
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-white/90 text-lg">{device.name || "Unknown Device"}</h3>
                    <p className="text-xs text-white/50 font-mono mt-1">{device.address}</p>
                    <p className="text-xs text-white/60 mt-2">
                      Last seen: {device.lastSeen ? formatTimeSince(device.lastSeen) : "Unknown"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {getSignalIcon(device.rssi)}
                    <p className="text-xs text-white/70 mt-2 font-mono">{device.rssi} dBm</p>
                  </div>
                  <div className="flex items-center">
                  <Glsbutton
                  text={"View Log"}
                  onClick={() => searchInteractions(device)}
                  />
                  </div>
                </div>
                
                {/* Expanded details */}
                <AnimatePresence>
                  {showDetails === device.address && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/10 bg-white/5"
                    >
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="text-sm text-white/60 mb-1">Signal Strength</h4>
                          <div className="w-full h-3 bg-white/10 -full overflow-hidden">
                            <div 
                              className={`h-full ${getSignalStrength(device.rssi).level === 'strong' ? 'bg-green-500' : getSignalStrength(device.rssi).level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(Math.max(Math.abs(device.rssi) - 30, 0) / 70 * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm text-white/60 mb-1">Device Type</h4>
                          <p className="text-white/80">
                            {device.name ? 
                              device.name.toLowerCase().includes('audio') || device.name.toLowerCase().includes('airpod') || 
                              device.name.toLowerCase().includes('speaker') || device.name.toLowerCase().includes('headphone') ? 
                                "Audio Device" : 
                              device.name.toLowerCase().includes('phone') || device.name.toLowerCase().includes('pixel') || 
                              device.name.toLowerCase().includes('galaxy') || device.name.toLowerCase().includes('iphone') ? 
                                "Mobile Phone" : 
                              device.name.toLowerCase().includes('watch') || device.name.toLowerCase().includes('band') ? 
                                "Wearable Device" : 
                              "Peripheral Device"
                            : "Unknown Device Type"}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm text-white/60 mb-1">Connection Status</h4>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 -full mr-2 ${Date.now() - (device.lastSeen || 0) < 1000 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <p className="text-white/80">{Date.now() - (device.lastSeen || 0) < 1000 ? 'Active' : 'Idle'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm text-white/60 mb-1">Estimated Distance</h4>
                          <p className="text-white/80">
                            {device.rssi > -50 ? "Very close (< 2m)" : 
                             device.rssi > -65 ? "Near (2-5m)" :
                             device.rssi > -75 ? "Medium (5-10m)" : "Far (>10m)"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Interaction history modal */}
        {showingInteractions && selectedDevice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 border border-white/20 -xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl text-white font-bold ${instrumentSerif.className}`}>
                  Interaction History
                </h3>
                <button
                  onClick={closeInteractionHistory}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-white/80 mb-4 flex items-center gap-4">
                <div className="bg-blue-500/30 p-2 -full">
                  <FaBluetooth className="text-blue-400 text-xl" />
                </div>
                <div>
                  <p className="font-medium">{selectedDevice.name || "Unknown Device"}</p>
                  <p className="text-sm text-white/60">{selectedDevice.address}</p>
                </div>
              </div>
              
              {loadingInteractions ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-t-2 border-t-white border-solid -full animate-spin"></div>
                </div>
              ) : interactionHistory.length > 0 ? (
                <div className="relative">
                  <div className="bg-white/5 border border-white/10 -xl overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaHistory className="text-blue-400" />
                        <h4 className="text-white/90 font-medium">Interaction {currentInteractionIndex + 1}</h4>
                      </div>
                      <div className="text-xs text-white/60 font-mono">
                        {new Date(interactionHistory[currentInteractionIndex].timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Analysis Section */}
                      <div className="bg-white/5 -lg p-3 border border-white/10">
                        <h5 className="text-white/70 font-medium mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Analysis
                        </h5>
                        <div className="flex gap-3">
                          {interactionHistory[currentInteractionIndex].Analysis && (
                            <>
                              <div className="px-3 py-1 -full bg-white/10 text-white/80 text-sm flex items-center gap-2">
                                <div className="w-3 h-3 -full" 
                                  style={{backgroundColor: interactionHistory[currentInteractionIndex].Analysis.color === 'Dark' ? '#5a3a1a' : 
                                                        interactionHistory[currentInteractionIndex].Analysis.color === 'Medium' ? '#c19a6b' : 
                                                        interactionHistory[currentInteractionIndex].Analysis.color === 'Fair' ? '#e8c39e' : 
                                                        interactionHistory[currentInteractionIndex].Analysis.color === 'Light' ? '#f6e2c7' : '#888888'}}></div>
                                <span>{interactionHistory[currentInteractionIndex].Analysis.color}</span>
                              </div>
                              <div className="px-3 py-1 -full bg-white/10 text-white/80 text-sm flex items-center gap-2">
                                <div className="w-3 h-3 -full" 
                                  style={{backgroundColor: interactionHistory[currentInteractionIndex].Analysis.texture === 'Rough' ? '#bf6836' : 
                                                        interactionHistory[currentInteractionIndex].Analysis.texture === 'Normal' ? '#8bc4a0' : 
                                                        interactionHistory[currentInteractionIndex].Analysis.texture === 'Smooth' ? '#57b7c9' : '#888888'}}></div>
                                <span>{interactionHistory[currentInteractionIndex].Analysis.texture}</span>
                              </div>
                            </>
                          )}
                          {!interactionHistory[currentInteractionIndex].Analysis && (
                            <span className="text-white/50 text-sm italic">No analysis data</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Device Section */}
                      <div className="bg-white/5 -lg p-3 border border-white/10">
                        <h5 className="text-white/70 font-medium mb-2 flex items-center gap-2">
                          <FaBluetooth className="h-4 w-4" />
                          Device Info
                        </h5>
                        {interactionHistory[currentInteractionIndex].device && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-white/50">Name:</div>
                            <div className="text-white/80">{interactionHistory[currentInteractionIndex].device.name || "Unknown"}</div>
                            <div className="text-white/50">Address:</div>
                            <div className="text-white/80 font-mono">{interactionHistory[currentInteractionIndex].device.address}</div>
                            <div className="text-white/50">Signal:</div>
                            <div className="text-white/80">{interactionHistory[currentInteractionIndex].device.rssi} dBm</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Ingredients Section */}
                      <div className="bg-white/5 -lg p-3 border border-white/10">
                        <h5 className="text-white/70 font-medium mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Ingredients
                        </h5>
                        {interactionHistory[currentInteractionIndex].Ingredients && interactionHistory[currentInteractionIndex].Ingredients.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {interactionHistory[currentInteractionIndex].Ingredients.slice(0, 5).map((ingredient, i) => (
                              <div key={i} className="px-2 py-1 -md bg-white/10 text-white/80 text-xs">
                                {ingredient.name || ingredient}
                              </div>
                            ))}
                            {interactionHistory[currentInteractionIndex].Ingredients.length > 5 && (
                              <div className="px-2 py-1 -md bg-white/10 text-white/80 text-xs">
                                +{interactionHistory[currentInteractionIndex].Ingredients.length - 5} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/50 text-sm italic">No ingredients data</span>
                        )}
                      </div>

                      {/* Products Section */}
                      <div className="bg-white/5 -lg p-3 border border-white/10">
                        <h5 className="text-white/70 font-medium mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Products
                        </h5>
                        {interactionHistory[currentInteractionIndex].Products && interactionHistory[currentInteractionIndex].Products.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {interactionHistory[currentInteractionIndex].Products.slice(0, 5).map((product, i) => (
                              <div key={i} className="px-2 py-1 -md bg-white/10 text-white/80 text-xs">
                                {product.name || product}
                              </div>
                            ))}
                            {interactionHistory[currentInteractionIndex].Products.length > 5 && (
                              <div className="px-2 py-1 -md bg-white/10 text-white/80 text-xs">
                                +{interactionHistory[currentInteractionIndex].Products.length - 5} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/50 text-sm italic">No product data</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Recommendations Section - Full Width */}
                    {interactionHistory[currentInteractionIndex].Recommendations && (
                      <div className="p-4 border-t border-white/10">
                        <h5 className="text-white/70 font-medium mb-2 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Recommendations
                        </h5>
                        <div className="bg-white/5 -lg p-3 text-white/80 text-sm">
                          {interactionHistory[currentInteractionIndex].Recommendations}
                        </div>
                      </div>
                    )}
                  </div>
                  <div 
                    className="absolute top-1/2 left-0 transform -translate-y-1/2 h-full w-20 flex items-center pl-2"
                    onMouseEnter={() => {
                      setHoverNavigation('left');
                      hoverTimerRef.current = setInterval(() => {
                        prevInteraction();
                      }, 500);
                    }}
                    onMouseLeave={() => {
                      setHoverNavigation(null);
                      if (hoverTimerRef.current) {
                        clearInterval(hoverTimerRef.current);
                        hoverTimerRef.current = null;
                      }
                    }}
                  >
                    <button
                      onClick={prevInteraction}
                      className={`bg-white/10 text-white/80 p-2 -full ${hoverNavigation === 'left' ? 'bg-white/30' : 'hover:bg-white/20'} transition-all`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <div 
                    className="absolute top-1/2 right-0 transform -translate-y-1/2 h-full w-20 flex items-center justify-end pr-2"
                    onMouseEnter={() => {
                      setHoverNavigation('right');
                      hoverTimerRef.current = setInterval(() => {
                        nextInteraction();
                      }, 500);
                    }}
                    onMouseLeave={() => {
                      setHoverNavigation(null);
                      if (hoverTimerRef.current) {
                        clearInterval(hoverTimerRef.current);
                        hoverTimerRef.current = null;
                      }
                    }}
                  >
                    <button
                      onClick={nextInteraction}
                      className={`bg-white/10 text-white/80 p-2 -full ${hoverNavigation === 'right' ? 'bg-white/30' : 'hover:bg-white/20'} transition-all`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 -xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-500/20 -full flex items-center justify-center mb-4">
                    <FaSearch className="text-blue-400 text-3xl" />
                  </div>
                  <h4 className="text-white/80 text-lg mb-2">No interaction history found</h4>
                  <p className="text-white/60">This device has not interacted with the system before.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Auto-scanning indicator */}
        <div className="fixed bottom-4 right-4 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-[20px] border border-[rgba(255,255,255,0.18)] -lg shadow-lg p-3 flex items-center gap-3">
          {scanning && (
            <div className="mr-2 w-5 h-5 border-t-2 border-t-blue-400 border-solid rounded-full animate-spin"></div>
          )}
          <span className={`text-white/80 ${instrumentSerif.className}`}>
            {scanning ? "Scanning for devices..." : "Auto-scanning active"}
          </span>
        </div>
      </div>
      
      {/* Add animation keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            opacity: 0.7;
          }
        }
      `}</style>
    </main>
  );
}