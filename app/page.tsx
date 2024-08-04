"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const maxDuration = 60;

export default function Home() {
  const [audioBuffer, setAudioBuffer] = useState<Uint8Array | null>(null);
  const router = useRouter();

  useEffect(() => {
    const recognizeSpeech = async () => {
      try {
        // AudioBuffer를 생성하는 예제
        const audioData = await fetch('https://bandy-contents.s3.ap-northeast-1.amazonaws.com/test.wav');
        const buffer = await audioData.arrayBuffer();
        setAudioBuffer(new Uint8Array(buffer));
        console.log("buffer:", buffer);

        // if (audioBuffer) {
        //   const response = await fetch('/api/assessment', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/octet-stream',
        //     },
        //     body: audioBuffer,
        //   });

        //   if (response.ok) {
        //     const data = await response.json();
        //     console.log("data:", data);
        //   } else {
        //     console.error('Failed to send audio buffer:', response.statusText);
        //   }
        // }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    recognizeSpeech();
  }, [audioBuffer, router]);

  return (
    <main>
      <h2>Speech Recognition Test</h2>
      <p>Check the console for recognition results.</p>
    </main>
  );
}
