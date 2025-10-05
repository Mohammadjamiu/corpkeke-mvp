"use client";

import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

// Brand colors
const BRAND_GREEN = "#38761D";
const BRAND_GOLD = "#e0b600";
const BRAND_RED = "#CC0000";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white p-6 overflow-hidden">
      {/* Animated floating accent */}
      <motion.div
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: BRAND_GOLD }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 6 }}
      />

      {/* Main content */}
      <div className="mx-auto max-w-2xl text-center z-10">
        {/* Logo */}
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="rounded-full border-4 border-[#38761D] p-4 shadow-lg bg-white">
            <MapPin className="h-10 w-10" style={{ color: BRAND_GOLD }} />
          </div>
        </motion.div>

        {/* Brand Name */}
        <h1 className="mb-3 text-5xl md:text-6xl font-extrabold tracking-tight">
          <span style={{ color: BRAND_GREEN }}>CORP</span>
          <span style={{ color: BRAND_GOLD }}>KÈKÉ</span>
        </h1>

        {/* Tagline */}
        <p
          className="text-sm font-semibold mb-6 uppercase tracking-wide"
          style={{ color: BRAND_GREEN }}
        >
          Fast, Reliable & Designed for Corpers
        </p>

        {/* Description */}
        <p className="mb-10 text-lg text-gray-600 leading-relaxed">
          Safe, affordable, and reliable Keke rides for NYSC members in Kano.
          Your trusted partner for stress-free transport.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            style={{
              backgroundColor: BRAND_GREEN,
              borderColor: BRAND_GOLD,
            }}
            className="text-white hover:brightness-110 font-bold shadow-lg transition-all duration-300"
          >
            <Link href="/auth/signup">Get Started</Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            style={{
              borderColor: BRAND_GOLD,
              color: BRAND_GREEN,
            }}
            className="border-2 font-bold hover:bg-gray-50 transition-all duration-300"
          >
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
      </div>

      {/* Footer Accent Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-4 flex">
        <div className="flex-1" style={{ backgroundColor: BRAND_GREEN }}></div>
        <div className="flex-1" style={{ backgroundColor: BRAND_GOLD }}></div>
      </div>
    </div>
  );
}
