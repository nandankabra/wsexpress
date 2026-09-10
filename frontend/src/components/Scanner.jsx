import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Scanner({ onScan, onError }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;
    
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText, decodedResult) => {
        scanner.clear(); // stop scanning after successful read
        if (onScan) onScan(decodedText, decodedResult);
      },
      (error) => {
        if (onError) onError(error);
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan, onError]);

  return <div id="reader" ref={scannerRef} className="w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border" />;
}
