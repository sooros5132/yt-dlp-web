'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// `use client` Warpper
export function ToastContainerProvider() {
  return (
    <ToastContainer
      position='bottom-right'
      autoClose={3000}
      closeOnClick={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme='dark'
    />
  );
}
