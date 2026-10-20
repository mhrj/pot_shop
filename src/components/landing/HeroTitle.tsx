'use client';

import { motion } from 'framer-motion';
import React from 'react';

type HeroTitleProps = {
  title: string;
  subtitle: string;
};

export default function HeroTitle({ title, subtitle }: HeroTitleProps) {
  // Renders the H1 and highlights the word "جان" with the vibrant animated gradient
  const renderHighlightedTitle = (text: string) => {
    if (!text.includes('جان')) {
      return text;
    }

    const parts = text.split('جان');
    return (
      <>
        {parts[0]}
        <span className="inline-block bg-gradient-to-r from-flora-700 via-dust-400 to-flora-700 bg-clip-text text-transparent animate-text-gradient font-black">
          جان
        </span>
        {parts.slice(1).join('جان')}
      </>
    );
  };

  return (
    <div className="flex flex-col">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 text-4xl leading-[1.25] font-black text-soil-900 sm:text-5xl lg:text-6xl"
      >
        {renderHighlightedTitle(title)}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 max-w-xl text-base leading-8 text-soil-700/85 sm:text-lg"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
