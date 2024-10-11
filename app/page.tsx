"use client";

import React, { useEffect, useState } from 'react';

export const maxDuration = 60;

export default function Home() {
  const [audioBuffer, setAudioBuffer] = useState<Uint8Array | null>(null);

  useEffect(() => {
    const recognizeSpeech = async () => {
      try {
        const response = await fetch('/api/assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("data:", data);
        } else {
          console.error('Failed to send audio buffer:', response.statusText);
        }

      } catch (error) {
        console.error('Error:', error);
      }
    };

    recognizeSpeech();
  }, []);

  return (
    <main>
      <h2>Speech Recognition Test</h2>
      <p>Check the console for recognition results.</p>
    </main>
  );
}
