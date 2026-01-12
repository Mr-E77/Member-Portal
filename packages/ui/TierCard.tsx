// packages/ui/TierCard.tsx
import React from "react";
import { Card } from "./Card";

interface TierCardProps {
  name: string;
  description: string;
  features: string[];
  onSelect?: () => void;
  isCurrent?: boolean;
}

export function TierCard({ name, description, features, onSelect, isCurrent }: TierCardProps) {
  return (
    <Card className={`transition-all hover:scale-105 ${isCurrent ? "border-2 border-blue-600 shadow-xl" : "hover:shadow-lg"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
        {isCurrent && <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">Current</span>}
      </div>
      <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-600 mr-3 font-bold text-lg">✓</span>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      {onSelect && (
        <button
          onClick={onSelect}
          className={`w-full py-3 rounded-md font-semibold transition-all ${
            isCurrent 
              ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
          }`}
          disabled={isCurrent}
        >
          {isCurrent ? "Current Tier" : "Select Tier"}
        </button>
      )}
    </Card>
  );
}
