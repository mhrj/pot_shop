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
        <span className="inline-block bg-gradient-to-r from-flora-700 via-dust-400 to-flora-700 dark:from-flora-300 dark:via-dust-300 dark:to-flora-300 bg-clip-text text-transparent animate-text-gradient font-black">
          جان
        </span>
        {parts.slice(1).join('جان')}
      </>
    );
  };

  return (
    <div className="flex flex-col items-center lg:items-start">
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 text-3xl sm:text-4xl lg:text-6xl leading-tight font-black text-soil-900 dark:text-dust-50 text-center lg:text-right"
      >
        {renderHighlightedTitle(title)}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7 max-w-xl text-base leading-8 text-soil-700/85 dark:text-dust-200/85 sm:text-lg mx-auto lg:mx-0 text-center lg:text-right"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
