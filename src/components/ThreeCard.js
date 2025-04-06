import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

const ThreeCard = ({
  initialWidth,
  initialHeight,
  initialDepth,
  auto_rotate = false,
  initialtopText = "",
  initialdescriptiveText = "",
  initialimageSrc = "",
}) => {
  const [topText, setTopText] = useState(initialtopText);
  const [descriptiveText, setDescriptiveText] = useState(
    initialdescriptiveText,
  );
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [depth, setDepth] = useState(initialDepth);
  const boxRef = useRef();
  const mousePosition = useRef({ x: 0, y: 0 });
  const lastMousePosition = useRef({ x: 0, y: 0 });

  const handleWidthChange = (e) => setWidth(e.target.value);
  const handleHeightChange = (e) => setHeight(e.target.value);
  const handleDepthChange = (e) => setDepth(e.target.value);

  // Handle mouse movement to calculate direction
  const handleMouseMove = (e) => {
    const { clientX: x, clientY: y } = e;
    const { innerWidth: width, innerHeight: height } = window;

    // Normalize mouse position to [-1, 1]
    mousePosition.current.x = (x / width) * 2 - 1;
    mousePosition.current.y = -(y / height) * 2 + 1;
  };

  // Automatically rotate the box or rotate toward the mouse direction
  useFrame(() => {
    if (auto_rotate && boxRef.current) {
      boxRef.current.rotation.y += 0.01; // Rotate around the Y-axis
    }

    // Calculate the direction of the mouse movement
    const deltaX = mousePosition.current.x - lastMousePosition.current.x;
    const deltaY = mousePosition.current.y - lastMousePosition.current.y;

    // Only rotate if there is movement
    if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
      if (boxRef.current) {
        // Rotate around X-axis based on deltaY
        boxRef.current.rotation.x += deltaY * 2;

        // Rotate around Y-axis based on deltaX
        boxRef.current.rotation.y += deltaX * 2;
      }
    }

    // Update the last mouse position for next frame
    lastMousePosition.current = { ...mousePosition.current };
  });

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Dynamically adjust font size based on card size
  const calculateFontSize = (dimension) => Math.max(dimension / 10, 0.5); // Ensure the font size doesn't become too small

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} />
      <mesh ref={boxRef}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial
          color="black"
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.5}
        />
        <lineSegments>
          {/* Top text */}
          <Text3D
            font={"font.json"}
            size={width / 20}
            position={[-(width / 3.5), height / 3, 0]} // Position at the top of the card
          >
            {topText}
          </Text3D>

          {/* Descriptive text */}
          <Text3D
            font={"font.json"}
            size={width / 20}
            position={[-(width / 3), 0, 0]} // Position in the center of the card
          >
            {descriptiveText}
          </Text3D>

          <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
          <lineBasicMaterial color="white" linewidth={2} />
        </lineSegments>
      </mesh>
      <OrbitControls />
    </>
  );
};

export default ThreeCard;
