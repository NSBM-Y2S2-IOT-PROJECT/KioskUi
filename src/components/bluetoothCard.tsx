import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import SERVER_ADDRESS from "config";

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

export default function BluetoothCard() {

  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Device timeout in milliseconds (5 seconds)
  const DEVICE_TIMEOUT = 5000;

  const scanForDevices = async () => {
    try {
      setScanning(true);
      setError(null);
      
      const response = await fetch(`${SERVER_ADDRESS}/data/scan_bluetooth`);
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
    if (rssi >= 50) return "●●●●"; // Excellent
    if (rssi >= 65) return "●●●○"; // Good
    if (rssi >= 75) return "●●○○"; // Fair
    return "●○○○"; // Poor
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
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        
        {devices.length === 0 ? (
          <p className="text-white/60 text-sm italic">No devices found. Scanning for Bluetooth devices...</p>
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
                </div>
                <div className="text-xs font-mono text-blue-400">
                  <span title={`Signal strength: ${device.rssi}dBm`}>
                    {getSignalIcon(device.rssi)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}