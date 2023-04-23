'use client';

import { useState } from 'react';

const defaultSrc = '';

export function Video() {
  const [videoSrc, setVideoSrc] = useState<string | null>(defaultSrc);

  return <video src={videoSrc || ''} controls />;
}
