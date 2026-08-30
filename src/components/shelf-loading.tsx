"use client";

import { useLocale } from "@/components/locale-provider";

export function ShelfLoading({ label }: { label?: string }) {
  const { t } = useLocale();
  const books = [
    { x: 46, y: 38, w: 14, h: 48 },
    { x: 66, y: 28, w: 12, h: 58 },
    { x: 84, y: 44, w: 16, h: 42 },
    { x: 106, y: 24, w: 13, h: 62 },
    { x: 125, y: 40, w: 15, h: 46 },
    { x: 146, y: 30, w: 11, h: 56 },
    { x: 163, y: 46, w: 17, h: 40 },
    { x: 186, y: 34, w: 12, h: 52 },
    { x: 204, y: 42, w: 14, h: 44 },
  ];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <p className="font-heading text-center text-3xl tracking-tight sm:text-4xl">
        {label ?? t("loading.shelf")}
      </p>
      <svg
        className="mt-10 text-foreground"
        width="280"
        height="130"
        viewBox="0 0 280 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <line x1="28" y1="100" x2="252" y2="100" />
          <line x1="24" y1="106" x2="256" y2="106" />
          <path d="M40 106 V118 H56 V106" />
          <path d="M224 106 V118 H240 V106" />

          <g className="shelf-books">
            {books.map((book, index) => {
              const spineX = book.x + book.w / 2;
              return (
                <g key={index} className="shelf-book">
                  <rect x={book.x} y={book.y} width={book.w} height={book.h} rx="1.5" />
                  <line
                    x1={spineX}
                    y1={book.y + 8}
                    x2={spineX}
                    y2={book.y + book.h - 8}
                    opacity="0.35"
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
