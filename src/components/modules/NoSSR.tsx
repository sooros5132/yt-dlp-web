'use client';

import React, { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';

export interface NoSSRProps {
  defaultComponent?: JSX.Element | React.ReactNode | string;
}

export function NoSSR({ defaultComponent, children }: PropsWithChildren<NoSSRProps>) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return defaultComponent ? defaultComponent : null;
  }

  return children;
}
