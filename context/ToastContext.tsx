"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircleFill, ExclamationTriangleFill, X, InfoCircleFill } from "react-bootstrap-icons";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* TOAST CONTAINER */}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="pointer-events-auto min-w-[300px] max-w-sm bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex"
            >
              <div className={`w-2 ${
                toast.type === "success" ? "bg-green-500" : 
                toast.type === "error" ? "bg-red-500" : "bg-blue-500"
              }`} />
              
              <div className="p-4 flex items-start gap-3 flex-1">
                <div className={`text-xl mt-0.5 ${
                   toast.type === "success" ? "text-green-500" : 
                   toast.type === "error" ? "text-red-500" : "text-blue-500"
                }`}>
                  {toast.type === "success" ? <CheckCircleFill /> : 
                   toast.type === "error" ? <ExclamationTriangleFill /> : <InfoCircleFill />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${
                     toast.type === "success" ? "text-green-800" : 
                     toast.type === "error" ? "text-red-800" : "text-navy"
                  }`}>
                    {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Info"}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{toast.message}</p>
                </div>
                <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-navy">
                  <X className="text-xl" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}