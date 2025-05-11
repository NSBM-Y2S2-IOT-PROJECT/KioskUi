
'use client';
import { useRef, useState, useEffect } from 'react';

export default function FaceDisplay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningLineRef = useRef(0);
  const scanningDirectionRef = useRef('down');
  const faceMeshRef = useRef<any>(null);
  const currentLandmarksRef = useRef<any[]>([]);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [score, setScore] = useState<string | null>('Analyzing...');
  const [noFaceDetected, setNoFaceDetected] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const FACIAL_FEATURES = {
    leftEye: 33,
    rightEye: 263,
    nose: 1,
    mouthLeft: 61,
    mouthRight: 291,
  };

  const COLORS = ['#FF6347', '#32CD32', '#1E90FF', '#FFD700', '#FF4500'];

  const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fill();
  };

  const drawFaceBox = (ctx: CanvasRenderingContext2D, landmarks: any[], index: number) => {
    const xs = landmarks.map((point) => point.x * ctx.canvas.width);
    const ys = landmarks.map((point) => point.y * ctx.canvas.height);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const color = COLORS[index % COLORS.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    ctx.fillStyle = color;
    ctx.font = '14px Arial';
    ctx.fillText(`Face ${index + 1}`, minX + 4, minY - 8);
  };

  const drawMesh = (ctx: CanvasRenderingContext2D, landmarks: any[], index: number) => {
    Object.values(FACIAL_FEATURES).forEach((idx) => {
      const point = landmarks[idx];
      drawDot(ctx, point.x * ctx.canvas.width, point.y * ctx.canvas.height);
    });

    drawFaceBox(ctx, landmarks, index);
  };

  const drawScanningLine = (ctx: CanvasRenderingContext2D) => {
    const canvasHeight = ctx.canvas.height;
    const speed = 2;

    if (scanningDirectionRef.current === 'down') {
      scanningLineRef.current += speed;
      if (scanningLineRef.current >= canvasHeight) scanningDirectionRef.current = 'up';
    } else {
      scanningLineRef.current -= speed;
      if (scanningLineRef.current <= 0) scanningDirectionRef.current = 'down';
    }

    ctx.beginPath();
    ctx.moveTo(0, scanningLineRef.current);
    ctx.lineTo(ctx.canvas.width, scanningLineRef.current);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const fetchScore = async () => {
    if (!currentLandmarksRef.current.length) {
      setStatusMessage('No face landmarks available.');
      setScore(null);
      return;
    }

    const face = currentLandmarksRef.current[0];
    const requiredLandmarks = [
      [face[33].x, face[33].y],     // left eye
      [face[263].x, face[263].y],   // right eye
      [face[1].x, face[1].y],       // nose
      [face[61].x, face[61].y],     // mouth left
      [face[291].x, face[291].y],   // mouth right
    ];

    try {
      const res = await fetch('http://localhost:5000/data/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ landmarks: requiredLandmarks }),
      });

      const data = await res.json();

      if (data.error) {
        setScore(null);
        setStatusMessage(data.error);
        setNoFaceDetected(true);
      } else if (data.score) {
        setScore(data.score);
        setNoFaceDetected(false);
      }
    } catch (err) {
      console.error('Score fetch error:', err);
      setScore(null);
      setStatusMessage('Error while fetching score.');
      setNoFaceDetected(true);
    }
  };

  const setupCameraAndFaceMesh = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      script.async = true;
      script.onload = () => {
        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            currentLandmarksRef.current = results.multiFaceLandmarks;
            setStatusMessage(`${results.multiFaceLandmarks.length} face(s) detected.`);
            results.multiFaceLandmarks.forEach((landmarks: any[], idx: number) => {
              drawMesh(ctx, landmarks, idx);
            });
          } else {
            currentLandmarksRef.current = [];
            setStatusMessage('No face detected. Please center your face.');
            drawScanningLine(ctx);
            setScore(null);
          }
        });

        faceMeshRef.current = faceMesh;

        const detectLoop = async () => {
          if (!videoRef.current) return;
          await faceMesh.send({ image: videoRef.current });
          requestAnimationFrame(detectLoop);
        };

        detectLoop();
      };

      document.body.appendChild(script);
    } catch (err) {
      console.error('Camera access error:', err);
      setStatusMessage('Camera access denied or unavailable.');
    }
  };

  const handleScoreButtonClick = () => {
    setAnalyzing(true);
    fetchScore().finally(() => setAnalyzing(false));
  };

  useEffect(() => {
    setupCameraAndFaceMesh();
    setCameraStarted(true);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraStarted(false);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[480px] mx-auto text-center py-6">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-red-500 shadow-md bg-gradient-to-r from-red-900 via-red-800 to-black">
        {!cameraStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white text-lg">
            <div className="w-16 h-16 border-t-4 border-r-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <span className="ml-4 text-lg">Loading camera...</span>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)', visibility: 'hidden' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={480}
          height={480}
        />
      </div>
      <div className="mt-4 text-sm text-white px-4 py-2 rounded shadow-lg">
        {statusMessage}
      </div>
      {noFaceDetected && (
        <div className="mt-4 text-sm text-red-500 px-4 py-2 rounded shadow-lg">
          No face detected. Please center your face.
        </div>
      )}
      {score && (
        <div className="mt-4 text-xl text-white font-bold">
          Beauty Score: {score}
        </div>
      )}
      <button
        onClick={handleScoreButtonClick}
        disabled={analyzing}
        className={`mt-4 py-3 px-8 text-white rounded-xl shadow-lg transition-all duration-300 transform ${
          analyzing
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:scale-105 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700'
        }`}
      >
        {analyzing ? (
          <div className="flex justify-center items-center space-x-2">
            <div className="w-5 h-5 border-t-2 border-t-white border-solid rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        ) : (
          'Get Beauty Score'
        )}
      </button>
    </div>
  );
}
