import { useState, useEffect } from 'react';

interface ModuleStatus {
  Kinect: string;
  BtLowEnergy: string;
  GPIO: string;
  VisumServer: string;
}

interface FetchResult {
  status: ModuleStatus | null;
  isLoading: boolean;
  error: string | null;
}

export const fetchSystemStatus = async (serverUrl: string): Promise<ModuleStatus> => {
    const modules = ['Kinect', 'BtLowEnergy', 'GPIO', 'VisumServer'];
    const statuses: Partial<ModuleStatus> = {};
  
    for (const module of modules) {
      const response = await fetch(`${serverUrl}/data/sys_check/${module}`);
      console.log(response);
      
    //   if (!response.ok) {
    //     throw new Error(`Failed to fetch ${module} status: ${response.statusText}`);
    //   }
      
      const data = await response.json();
      statuses[module as keyof ModuleStatus] = data.info;
    }
  
    return statuses as ModuleStatus;
};