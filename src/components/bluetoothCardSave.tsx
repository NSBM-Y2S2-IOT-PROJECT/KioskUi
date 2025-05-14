import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import Glsbutton from "./glsbutton";
import { Flip, ToastContainer, toast } from 'react-toastify';

const instrumentSerif = Instrument_Serif({ 
    weight: "400",
    subsets: ["latin"]
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

// New interfaces for the added parameters
interface SkinAnalysis {
  score: number;
  issues: string[];
  overall: string;
}

interface Ingredient {
  name: string;
  benefits: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
}

interface Recommendation {
  type: string;
  description: string;
}

interface BluetoothCardSaveProps {
  Analysis?: SkinAnalysis;
  Ingredients?: Ingredient[];
  Products?: Product[];
  Recommendations?: Recommendation[];
  CurrentTime?: string;
}

// Function to save interaction data to MongoDB via API
const saveInteraction = async (data: any) => {
  try {
    const response = await fetch("http://localhost:5000/data/save_interaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Failed to save interaction data");
    }
    
    console.log("Interaction saved successfully:", result);
    return { success: true, data: result };
  } catch (err) {
    console.error("Error saving interaction:", err);
    return { success: false, error: err.message };
  }
};

export default function BluetoothCardSave({
  Analysis,
  Ingredients,
  Products,
  Recommendations,
  CurrentTime
}: BluetoothCardSaveProps) {

  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<{
    saving: boolean;
    message: string | null;
    deviceId?: string;
  }>({ saving: false, message: null });
  
  // Device timeout in milliseconds (5 seconds)
  const DEVICE_TIMEOUT = 5000;

  const scanForDevices = async () => {
    try {
      setScanning(true);
      setError(null);
      
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
    } catch (err) {
      console.error("Error scanning for Bluetooth devices:", err);
      setError("Failed to scan for Bluetooth devices");
    } finally {
      setScanning(false);
    }
  };

  // Function to get signal strength icon based on RSSI value
  const getSignalIcon = (rssi: number) => {
    if (rssi >= 50) return ""; // Excellent
    if (rssi >= 65) return ""; // Good
    if (rssi >= 75) return ""; // Fair
    return ""; // Poor
  };

  // Auto-scan every 3 seconds
  useEffect(() => {
    scanForDevices(); // Initial scan when component mounts
    
    const intervalId = setInterval(() => {
      scanForDevices();
    }, 3000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

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

  // Function to handle saving the data along with the new parameters
  const handleSaveDevice = async (device: BluetoothDevice) => {
    console.log(`Clicked on ${device.name}`);
    
    // Prepare data for saving
    const dataToSave = {
      device,
      Analysis,
      Ingredients,
      Products,
      Recommendations,
      savedAt: CurrentTime || new Date().toISOString()
    };
    
    console.log('Data to be saved:', dataToSave);
    
    // Set saving status
    setSavingStatus({
      saving: true,
      message: `Saving data for ${device.name || 'device'}...`,
      deviceId: device.address
    });
    
    try {
      // Save data to MongoDB
      const result = await saveInteraction(dataToSave);
      
      if (result.success) {
        toast('Data saved successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        }
        )
        setSavingStatus({
          saving: false,
          message: `Data saved successfully!`,
          deviceId: device.address
        });

        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSavingStatus(prev => 
            prev.deviceId === device.address 
              ? { saving: false, message: null }
              : prev
          );
        }, 3000);
      } else {
        setSavingStatus({
          saving: false,
          message: `Error saving data.`,
          deviceId: device.address
        });
      }
    } catch (err) {
      console.error("Error saving to MongoDB:", err);
      setSavingStatus({
        saving: false,
        message: `Failed to save data.`,
        deviceId: device.address
      });
    }
  };

  return (
    <Card className={`fixed bottom-4 left-4 w-80 shadow-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-[20px] border border-[rgba(255,255,255,0.18)] ${instrumentSerif.className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center text-white/90">
          <span>Bluetooth Devices</span>
          <div className="flex items-center">
            {scanning && (
              <div className="mr-2 w-5 h-5 border-t-2 border-t-blue-400 border-solid rounded-full animate-spin"></div>
            )}
            <span className="text-sm text-white/60">Auto-scanning</span>
          </div>
        </CardTitle>
        {CurrentTime && <div className="text-xs text-white/60">Current time: {CurrentTime}</div>}
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        
        {devices.length === 0 ? (
          <p className="text-white text-sm italic">Open the bluetooth menu on your device...</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-auto">
            {devices.map((device) => (
              <div 
                key={device.address} 
                className="p-2 border border-white/10 rounded bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-white/90">{device.name || "Unknown Device"}</p>
                  <p className="text-xs text-white/50">{device.address}</p>
                  {savingStatus.deviceId === device.address && savingStatus.message && (
                    <p className={`text-xs mt-1 ${savingStatus.saving ? 'text-blue-400' : savingStatus.message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                      {savingStatus.message}
                    </p>
                  )}
                </div>
                <div className="text-xs font-mono text-blue-400">
                  <span title={`Signal strength: ${device.rssi}dBm`}>
                    {getSignalIcon(device.rssi)}
                  </span>
                </div>
                <Glsbutton
                  onClick={() => handleSaveDevice(device)}
                  text={savingStatus.deviceId === device.address && savingStatus.saving ? "Saving..." : "Save"}
                  onSignalComplete={(signal) => {
                    console.log(`Signal complete for ${device.name}: ${signal}`);
                    // Handle signal completion if needed
                  }}
                  disabled={savingStatus.deviceId === device.address && savingStatus.saving}
                />
              </div>
            ))}
          </div>
        )}
        <ToastContainer
          position="top-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </CardContent>
    </Card>
  );
}