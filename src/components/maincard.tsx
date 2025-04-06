import React, { useRef, useState } from "react";

const CameraCard = () => {
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } else {
        console.error("Video element not found.");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  return (
    <div
      style={{
        width: "400px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#333",
        color: "#fff",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>Camera UI</h2>

      <div
        style={{
          width: "100%",
          height: "200px",
          backgroundColor: "#ccc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        {isCameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              backgroundColor: "black", // Optional: Ensure background is visible if video doesn't cover
            }}
          />
        ) : (
          <p>Camera Feed</p>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={startCamera}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Start Camera
        </button>
        <button
          onClick={stopCamera}
          style={{
            padding: "10px 20px",
            backgroundColor: "#DC3545",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Stop Camera
        </button>
      </div>

      <div>
        <button
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: "#6C757D",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Skin Color
        </button>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#6C757D",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Skin Texture
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <p>This is a Chat History Demo</p>
      </div>

      <button
        style={{
          padding: "10px 20px",
          marginTop: "20px",
          backgroundColor: "#28A745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Speak
      </button>
    </div>
  );
};

export default CameraCard;
