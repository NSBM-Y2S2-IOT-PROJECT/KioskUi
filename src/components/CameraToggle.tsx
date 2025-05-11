'use client';
import { useState } from 'react';

export default function CameraToggle() {
  const [on, setOn] = useState(false);

  return (
    <div className="absolute top-28 right-10">
      <label className="flex items-center space-x-2">
        <span>Camera on/off</span>
        <input
          type="checkbox"
          checked={on}
          onChange={() => setOn(!on)}
          className="toggle toggle-primary"
        />
      </label>
    </div>
  );
}
