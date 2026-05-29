"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Payment {
  id: number;
  namaWp: string;
  rt: string;
  rw: string;
  dusun: string;
  timestamp: string;
}

export function SocialProofNotification() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fetch recent payments on mount
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/public/recent-payments");
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setPayments(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch recent payments:", error);
      }
    };
    fetchPayments();
  }, []);

  useEffect(() => {
    if (payments.length === 0) return;

    // Show first notification after 3 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(initialTimer);
  }, [payments]);

  useEffect(() => {
    if (payments.length === 0) return;

    let hideTimer: NodeJS.Timeout;
    let nextTimer: NodeJS.Timeout;

    if (isVisible) {
      // Hide after 5 seconds
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    } else {
      // Wait 15 seconds before showing the next one
      nextTimer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % payments.length);
        setIsVisible(true);
      }, 15000);
    }

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [isVisible, payments.length]);

  if (payments.length === 0) return null;

  const currentPayment = payments[currentIndex];
  const timeAgo = currentPayment.timestamp
    ? formatDistanceToNow(new Date(currentPayment.timestamp), { addSuffix: true, locale: id })
    : "Baru saja";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-6 z-50 pointer-events-auto"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-700 p-4 max-w-sm flex items-start gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-full shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
                <span className="font-bold">{currentPayment.namaWp}</span> dari {currentPayment.dusun && currentPayment.dusun !== "-" ? currentPayment.dusun : `RT ${currentPayment.rt}/RW ${currentPayment.rw}`} baru saja melunasi PBB.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {timeAgo}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
