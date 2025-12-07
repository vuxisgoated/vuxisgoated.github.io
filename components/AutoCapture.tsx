
import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';

interface AutoCaptureProps {
  url: string;
  interval: number; // seconds
  trustedIp: string;
}

export const AutoCapture = ({ url, interval, trustedIp }: AutoCaptureProps) => {
  const { gl } = useThree();
  const [shouldCapture, setShouldCapture] = useState(false);

  // Initial IP Check
  useEffect(() => {
    if (!url || interval <= 0) return;

    const checkIp = async () => {
      try {
        // Fetch current public IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const myIp = data.ip;

        console.log(`Detected IP: ${myIp}`);

        // If my IP matches the trusted IP, DO NOT capture
        if (myIp === trustedIp) {
            console.log("Trusted IP detected. Auto-recording disabled.");
            setShouldCapture(false);
        } else {
            console.log("Auto-recording enabled.");
            setShouldCapture(true);
        }
      } catch (error) {
        console.warn("Could not verify IP, defaulting to enabled:", error);
        setShouldCapture(true);
      }
    };

    checkIp();
  }, [url, interval, trustedIp]);

  // Interval Capture Loop
  useEffect(() => {
    if (!shouldCapture || !url || interval <= 0) return;

    const timer = setInterval(() => {
      // Capture the current canvas state
      const dataUrl = gl.domElement.toDataURL('image/png');

      // Simple fire-and-forget upload
      // We use text/plain to avoid some strict CORS preflight checks on Google Apps Script
      fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          image: dataUrl,
          timestamp: new Date().toISOString(),
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      })
      .then(() => console.log(`Snapshot uploaded at ${new Date().toLocaleTimeString()}`))
      .catch((err) => console.error("Snapshot upload failed:", err));

    }, interval * 1000);

    return () => clearInterval(timer);
  }, [shouldCapture, url, interval, gl]);

  return null;
};
