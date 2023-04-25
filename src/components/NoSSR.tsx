'use client';

import React, { PropsWithChildren, useEffect, useState } from 'react';

export interface NoSSRProps {
  defaultComponent?: JSX.Element | React.ReactNode | string;
}

export function NoSSR({ defaultComponent, children }: PropsWithChildren<NoSSRProps>) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    if (defaultComponent) {
      return <>{defaultComponent}</>;
    }
    return <></>;
  }

  return <>{children}</>;
}