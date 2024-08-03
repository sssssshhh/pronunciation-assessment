"use client"

import React, { useEffect } from 'react';

export const maxDuration = 300;

export default function Home() {
  useEffect(() => {
    const recognizeSpeech = async () => {
      try {
        const response = await fetch('/api/assessment', {
          method: 'POST',
        });
        const data = await response.json();
        console.log("data:", data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    recognizeSpeech();
  }, []);

  return (
    <main>
      <h2>Speech Recognition Test</h2>
      <p>Check the console for recognition resultss.</p>
    </main>
  );
}

