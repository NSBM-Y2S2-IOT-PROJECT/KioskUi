'use client';
import { useRef, useState, useEffect } from 'react';
import { Instrument_Serif } from "next/font/google";
import Glsbutton from "@/components/glsbutton";

const instrumentSerif = Instrument_Serif({ 
  weight: "400",
  subsets: ["latin"]
});

export default function FaceDisplay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<any[]>([]);
  const scanningLineRef = useRef(0);
  const scanningDirectionRef = useRef('down');
  const faceMeshRef = useRef<any>(null);
  const currentLandmarksRef = useRef<any[]>([]);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing camera...');
  const [score, setScore] = useState<string | null>('Analyzing...');
  const [noFaceDetected, setNoFaceDetected] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Facial feature mapping
  const FACIAL_FEATURES = {
    leftEye: 33,
    rightEye: 263,
    nose: 1,
    mouthLeft: 61,
    mouthRight: 291,
  };

  const COLORS = ['#FF6347', '#32CD32', '#1E90FF', '#FFD700', '#FF4500'];

  // Tilt effect functions
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 8; // Reduced intensity for subtlety
    const y = ((e.clientY - top) / height - 0.5) * -8;
    card.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
    }
  };

  // All drawing functions
  const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI); // Slightly larger dots
    ctx.fillStyle = 'rgba(255, 0, 80, 0.8)'; // Matching the glow color
    ctx.fill();
  };

  const drawFaceBox = (ctx: CanvasRenderingContext2D, landmarks: any[], index: number) => {
    const xs = landmarks.map((point) => point.x * ctx.canvas.width);
    const ys = landmarks.map((point) => point.y * ctx.canvas.height);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const color = 'rgba(255, 0, 80, 0.6)'; // Match the theme color
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    ctx.fillStyle = color;
    ctx.font = '16px "Instrument Serif", serif';
    ctx.fillText(`Face ${index + 1}`, minX + 4, minY - 10);
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

    // Create gradient for scanning line
    const gradient = ctx.createLinearGradient(0, scanningLineRef.current - 5, 0, scanningLineRef.current + 5);
    gradient.addColorStop(0, 'rgba(255, 0, 80, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 0, 80, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 0, 80, 0)');

    ctx.beginPath();
    ctx.moveTo(0, scanningLineRef.current);
    ctx.lineTo(ctx.canvas.width, scanningLineRef.current);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const createParticles = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    if (!landmarks.length) return;
    
    const face = landmarks[0];
    // Create particles around key facial features
    Object.values(FACIAL_FEATURES).forEach(idx => {
      const point = face[idx];
      const x = point.x * ctx.canvas.width;
      const y = point.y * ctx.canvas.height;
      
      // Add 1-3 new particles at each facial feature point
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x,
          y,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          color: `rgba(255, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 150)}, ${Math.random() * 0.7 + 0.3})`,
          life: 100
        });
      }
    });
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.life -= 1;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      return particle.life > 0;
    });
    
    // Limit particles to prevent performance issues
    if (particlesRef.current.length > 150) {
      particlesRef.current = particlesRef.current.slice(-150);
    }
  };

  const drawFacialFeatureConnections = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    if (!landmarks.length) return;
    
    const face = landmarks[0];
    const featurePoints = Object.values(FACIAL_FEATURES).map(idx => ({
      x: face[idx].x * ctx.canvas.width,
      y: face[idx].y * ctx.canvas.height
    }));
    
    // Connect the dots with glowing lines
    ctx.beginPath();
    ctx.moveTo(featurePoints[0].x, featurePoints[0].y);
    for (let i = 1; i < featurePoints.length; i++) {
      ctx.lineTo(featurePoints[i].x, featurePoints[i].y);
    }
    ctx.closePath();
    
    ctx.strokeStyle = 'rgba(255, 0, 80, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Add subtle glow
    ctx.shadowColor = 'rgba(255, 0, 80, 0.8)';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(255, 0, 80, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
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
          
          // Add a subtle color filter over the video
          ctx.fillStyle = 'rgba(20, 0, 40, 0.15)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            currentLandmarksRef.current = results.multiFaceLandmarks;
            setStatusMessage(`Face detected. Position yourself centrally for best results.`);
            
            // Update particle system
            if (Math.random() > 0.7) { // Only spawn particles occasionally
              createParticles(ctx, results.multiFaceLandmarks);
            }
            
            results.multiFaceLandmarks.forEach((landmarks: any[], idx: number) => {
              drawMesh(ctx, landmarks, idx);
              drawFacialFeatureConnections(ctx, [landmarks]);
            });
            
            setNoFaceDetected(false);
          } else {
            currentLandmarksRef.current = [];
            setStatusMessage('No face detected. Please center your face.');
            drawScanningLine(ctx);
            setScore(null);
            setNoFaceDetected(true);
          }
          
          // Always update and draw particles
          updateAndDrawParticles(ctx);
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
    setShowAnimation(true);
    fetchScore().finally(() => {
      setAnalyzing(false);
      setTimeout(() => setShowAnimation(false), 3000); // Animation duration
    });
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
    <div className="relative w-full max-w-[520px] mx-auto text-center">
      <div className="relative z-10 mb-6">
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="bg-transparent backdrop-blur-[20px] rounded-[16px] border border-[rgba(255,255,255,0.18)] transition-transform duration-300 ease-out flex flex-col items-center justify-between relative w-full aspect-square overflow-hidden shadow-lg"
          style={{ 
            transformStyle: "preserve-3d",
            boxShadow: `
              0 0 10px rgba(255, 0, 80, 0.2),
              0 0 20px rgba(255, 0, 80, 0.1),
              0 0 30px rgba(255, 0, 80, 0.05)
            `,
            background: "linear-gradient(145deg, rgba(30, 5, 35, 0.6) 0%, rgba(25, 0, 25, 0.8) 100%)"
          }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[url('/subtle-pattern.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-pink-500/30 to-transparent"></div>
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-pink-500/30 to-transparent"></div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-500/40 rounded-tl-md"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pink-500/40 rounded-tr-md"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pink-500/40 rounded-bl-md"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-500/40 rounded-br-md"></div>
          
          {/* Loading state */}
          {!cameraStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white z-10">
              <div className="w-16 h-16 border-t-4 border-r-4 border-[rgba(255,0,80,0.8)] border-solid rounded-full animate-spin"></div>
              <span className={`ml-4 text-lg ${instrumentSerif.className}`}>Loading camera...</span>
            </div>
          )}
          
          {/* Hidden video element */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', visibility: 'hidden' }}
          />
          
          {/* Canvas for face detection */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={520}
            height={520}
          />
          
          {/* Golden ratio overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="opacity-30">
              {/* Fibonacci spiral approximation */}
              <path d="M50,50 Q65,35 80,50 T50,80 T20,50 T50,20 T80,50" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5"/>
              {/* Vertical and horizontal dividing lines */}
              <line x1="38.2" y1="0" x2="38.2" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3"/>
              <line x1="61.8" y1="0" x2="61.8" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3"/>
              <line x1="0" y1="38.2" x2="100" y2="38.2" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3"/>
              <line x1="0" y1="61.8" x2="100" y2="61.8" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3"/>
              {/* Center guide circle */}
              <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" strokeDasharray="2,2"/>
            </svg>
          </div>
        </div>

        {/* Status message */}
        <div className={`mt-5 text-sm text-white px-4 py-2 rounded ${instrumentSerif.className} bg-black/20 backdrop-blur-sm inline-block`}>
          {statusMessage}
        </div>
        
        {/* Error message */}
        {noFaceDetected && (
          <div className="mt-3 text-sm text-[rgba(255,0,80,0.9)] px-4 py-2 rounded backdrop-blur-sm bg-black/30 shadow-inner">
            <span className="animate-pulse inline-block mr-2">⚠</span>
            No face detected. Please center your face.
          </div>
        )}
        
        {/* Score display */}
        {score && (
          <div className="mt-6 relative">
            <div 
              className={`text-3xl text-white font-bold ${instrumentSerif.className} transform transition-all duration-500`}
              style={{
                textShadow: `
                  0 0 10px rgba(255, 0, 80, 0.4),
                  0 0 20px rgba(255, 0, 80, 0.3),
                  0 0 30px rgba(255, 0, 80, 0.2)
                `,
                animation: showAnimation 
                  ? "scoreReveal 2s cubic-bezier(0.34, 1.56, 0.64, 1)" 
                  : "glow 1.5s ease-in-out infinite alternate"
              }}
            >
              Beauty Score: {score}
            </div>
            {showAnimation && (
              <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
                <div className="w-40 h-40 rounded-full border-2 border-pink-500 animate-ping opacity-70"></div>
                <div className="absolute w-32 h-32 rounded-full border-2 border-pink-300 animate-ping opacity-50" style={{ animationDelay: "0.3s" }}></div>
              </div>
            )}
          </div>
        )}
        
        {/* Score button */}
        <div className="flex items-center justify-center mt-6">
          <Glsbutton
            text={analyzing ? "Analyzing..." : "Get Beauty Score"}
            onClick={handleScoreButtonClick}
            disabled={analyzing}
            className={`py-3 px-8 text-white rounded-xl shadow-lg transition-all duration-300 transform ${
              analyzing
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:scale-105'
            }`}
          />
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes glow {
          from {
            filter: drop-shadow(0 0 5px rgba(255, 0, 80, 0.7));
          }
          to {
            filter: drop-shadow(0 0 15px rgba(255, 0, 80, 0.9));
          }
        }
        
        @keyframes scoreReveal {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
