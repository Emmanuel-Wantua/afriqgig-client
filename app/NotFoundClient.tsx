"use client";

import Link from "next/link";
import { House, ExclamationTriangle } from "react-bootstrap-icons";

export default function NotFoundContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-navy p-6 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-gold/10 text-gold rounded-full flex items-center justify-center text-5xl mb-6">
              <ExclamationTriangle />
          </div>
          
          <h1 className="text-4xl font-extrabold mb-2 text-navy">404</h1>
          <h2 className="text-xl font-bold mb-4 text-gray-700">Page Not Found</h2>
          
          <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
            Oops! The page you are looking for seems to have gone on an adventure without us. It might have been moved or deleted.
          </p>
          
          <Link 
            href="/" 
            className="px-8 py-3 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all shadow-lg flex items-center gap-2"
          >
            <House className="text-lg" /> Back Home
          </Link>
      </div>
    </div>
  );
}