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
    <Card className={`${isCurrent ? "border-2 border-blue-600" : ""}`}>
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      {onSelect && (
        <button
          onClick={onSelect}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          disabled={isCurrent}
        >
          {isCurrent ? "Current Tier" : "Select Tier"}
        </button>
      )}
    </Card>
  );
}
