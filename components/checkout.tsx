"use client";

import React, { useState, useEffect } from "react";
import { product } from "@/lib/product";

// Declare window.snap for TypeScript
declare global {
  interface Window {
    snap: {
      pay: (token: string, options?: any) => void;
    };
  }
}


const Checkout = () => {
  const [quantity, setQuantity] = useState(1);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);

  useEffect(() => {
    // Load Midtrans Snap script
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_CLIENT || '');
    script.onload = () => {
      setIsSnapLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap script');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src="https://app.sandbox.midtrans.com/snap/snap.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const decreaseQuantity = () => {
    setQuantity((prevState) => (prevState > 1 ? prevState - 1 : prevState));
  };

  const increaseQuantity = () => {
    setQuantity((prevState) => prevState + 1);
  };

  const checkout = async () => {
    const data = {
      id: product.id,
      productName: product.name,
      price: product.price,
      quantity: quantity,
    };

    try {
      const response = await fetch("/api/midtrans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Payment request failed');
      }

      const requestData = await response.json();
      
      // Check if Snap is loaded and available
      if (!isSnapLoaded || !window.snap) {
        throw new Error('Midtrans Snap is not loaded');
      }
      
      // Use the Snap payment method
      window.snap.pay(requestData.token, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          alert('Pembayaran berhasil!');
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          alert('Pembayaran pending, silakan selesaikan pembayaran.');
        },
        onError: function(result: any) {
          console.log('Payment error:', result);
          alert('Terjadi kesalahan dalam pembayaran.');
        },
        onClose: function() {
          console.log('Payment popup closed');
        }
      });
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.');
    }
  }

  const generatePaymentLink = async () => {
    try {
      const payload = {
        items: [
          { id: String(product.id), name: product.name, price: product.price, quantity }
        ],
        amount: product.price * quantity,
        external_id: `order-${product.id}-${Date.now()}`,
      };

      const res = await fetch('/api/midtrans/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to create payment link', data);
        alert('Gagal membuat payment link');
        return;
      }
      // Open the payment link URL returned by Midtrans
      if (data && data.payment_link && data.payment_link.url) {
        window.open(data.payment_link.url, '_blank');
      } else if (data && data.redirect_url) {
        window.open(data.redirect_url, '_blank');
      } else {
        console.warn('Unexpected payment link response', data);
        alert('Payment link dibuat, tapi respons tidak terduga. Cek console.');
      }
    } catch (err) {
      console.error('Failed to create payment link', err);
      alert('Gagal membuat payment link');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex sm:gap-4">
          <button
            className="transition-all hover:opacity-75"
            onClick={decreaseQuantity}
          >
            ➖
          </button>

          <input
            type="number"
            id="quantity"
            value={quantity}
            className="h-10 w-16 text-black border-transparent text-center"
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setQuantity(isNaN(value) || value < 1 ? 1 : value);
            }}
          />

          <button
            className="transition-all hover:opacity-75"
            onClick={increaseQuantity}
          >
            ➕
          </button>
        </div>
        <button
          className="rounded bg-indigo-500 p-4 text-sm font-medium transition hover:scale-105"
          onClick={checkout}
        >
          Checkout
        </button>
      </div>
      <button
        className="text-indigo-500 py-4 text-sm font-medium transition hover:scale-105"
        onClick={generatePaymentLink}
      >
        Create Payment Link
      </button>
    </>
  );
};

export default Checkout;