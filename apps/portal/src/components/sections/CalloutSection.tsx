// apps/portal/src/components/sections/CalloutSection.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@mre/ui";

export function CalloutSection() {
  return (
    <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Ready to Get Started?
        </h2>
        <p className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed">
          Join today and unlock access to your Mr.E Profile and membership benefits.
        </p>
        <Button
          onClick={() => signIn()}
          className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-4 font-semibold shadow-xl hover:shadow-2xl transition-all"
        >
          Create Your Account
        </Button>
      </div>
    </section>
  );
}
