"use client";

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  count?: number;
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  className?: string;
  isEditable?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  count = 5,
  value,
  onChange,
  size = 24,
  className,
  isEditable = true,
}) => {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const handleMouseOver = (newValue: number) => {
    if (isEditable) {
      setHoverValue(newValue);
    }
  };

  const handleMouseLeave = () => {
    if (isEditable) {
      setHoverValue(undefined);
    }
  };

  const handleClick = (newValue: number) => {
    if (isEditable && onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: count }, (_, i) => {
        const ratingValue = i + 1;
        return (
          <Star
            key={ratingValue}
            size={size}
            className={cn(
              "transition-colors",
              isEditable ? "cursor-pointer" : "cursor-default",
              (hoverValue || value) >= ratingValue
                ? "text-royal-gold fill-royal-gold"
                : "text-gray-300"
            )}
            onMouseOver={() => handleMouseOver(ratingValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(ratingValue)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;