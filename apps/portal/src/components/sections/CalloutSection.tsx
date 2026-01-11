// apps/portal/src/components/sections/CalloutSection.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@mre/ui";

export function CalloutSection() {
  return (
    <section className="bg-blue-600 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl mb-8">
          Join today and unlock access to your Mr.E Profile and membership benefits.
        </p>
        <Button
          onClick={() => signIn()}
          className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
        >
          Create Your Account
        </Button>
      </div>
    </section>
  );
}
