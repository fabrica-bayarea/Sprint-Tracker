"use client";

import { Button } from "@/components/ui/button";

const FIBONACCI = ["1", "2", "3", "5", "8", "13", "20", "?"];

export function CardDeck({
  selected,
  onSelect,
  disabled,
}: {
  selected?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 p-4">
      {FIBONACCI.map((value) => (
        <Button
          key={value}
          onClick={() => onSelect(value)}
          disabled={disabled}
          variant={selected === value ? "default" : "outline"}
          className={`w-12 h-16 md:w-16 md:h-24 text-lg md:text-2xl font-bold transition-all duration-200 rounded-xl ${
            selected === value
              ? "bg-red-600 hover:bg-red-700 text-white transform -translate-y-4 shadow-lg shadow-red-500/30"
              : "bg-muted hover:bg-muted/80 text-foreground hover:-translate-y-2"
          }`}
        >
          {value}
        </Button>
      ))}
    </div>
  );
}
