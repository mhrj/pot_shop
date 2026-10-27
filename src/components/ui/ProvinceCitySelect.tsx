'use client';

import { useMemo } from 'react';
import { IRAN_PROVINCES, getCitiesForProvince } from '@/lib/iran-data';
import { FormError } from '@/components/ui/FormError';

export type ProvinceCityValue = {
  province: string;
  city: string;
};

export type ProvinceCitySelectProps = {
  value: ProvinceCityValue;
  onChange: (value: ProvinceCityValue) => void;
  required?: boolean;
  disabled?: boolean;
  provinceLabel?: string;
  cityLabel?: string;
  provincePlaceholder?: string;
  cityPlaceholder?: string;
  className?: string;
  errorProvince?: string;
  errorCity?: string;
  idPrefix?: string;
};

export default function ProvinceCitySelect({
  value,
  onChange,
  required = false,
  disabled = false,
  provinceLabel = 'استان',
  cityLabel = 'شهر',
  provincePlaceholder = 'انتخاب استان',
  cityPlaceholder = 'انتخاب شهر',
  className = '',
  errorProvince,
  errorCity,
  idPrefix = 'region',
}: ProvinceCitySelectProps) {
  const availableCities = useMemo(() => {
    return getCitiesForProvince(value.province);
  }, [value.province]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value;
    onChange({
      province: newProvince,
      city: '',
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    onChange({
      province: value.province,
      city: newCity,
    });
  };

  const isCityDisabled = disabled || !value.province;

  return (
    <div className={`grid gap-4 sm:grid-cols-2 w-full ${className}`} dir="rtl">
      {/* Province Select */}
      <label
        htmlFor={`${idPrefix}-province`}
        className="block text-xs font-bold text-soil-700/80 dark:text-dust-200"
      >
        <span>{provinceLabel}</span>
        {required && <span className="text-red-500 ms-0.5">*</span>}
        <select
          id={`${idPrefix}-province`}
          name="province"
          value={value.province || ''}
          onChange={handleProvinceChange}
          required={required}
          disabled={disabled}
          className={`mt-1 w-full rounded-xl border bg-dust-50 dark:bg-flora-950 px-3 py-2.5 text-sm text-soil-900 dark:text-dust-50 outline-none transition cursor-pointer ${
            errorProvince
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-soil-900/10 dark:border-dust-50/20 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="" disabled className="dark:bg-flora-950 dark:text-dust-50">
            {provincePlaceholder}
          </option>
          {IRAN_PROVINCES.map((p) => (
            <option key={p.name} value={p.name} className="dark:bg-flora-950 dark:text-dust-50">
              {p.name}
            </option>
          ))}
        </select>
        <FormError message={errorProvince} />
      </label>

      {/* City Select */}
      <label
        htmlFor={`${idPrefix}-city`}
        className="block text-xs font-bold text-soil-700/80 dark:text-dust-200"
      >
        <span>{cityLabel}</span>
        {required && <span className="text-red-500 ms-0.5">*</span>}
        <select
          id={`${idPrefix}-city`}
          name="city"
          value={value.city || ''}
          onChange={handleCityChange}
          required={required}
          disabled={isCityDisabled}
          className={`mt-1 w-full rounded-xl border bg-dust-50 dark:bg-flora-950 px-3 py-2.5 text-sm text-soil-900 dark:text-dust-50 outline-none transition cursor-pointer ${
            errorCity
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-soil-900/10 dark:border-dust-50/20 focus:border-flora-500 focus:ring-2 focus:ring-flora-500/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="" disabled className="dark:bg-flora-950 dark:text-dust-50">
            {value.province ? cityPlaceholder : 'ابتدا استان را انتخاب کنید'}
          </option>
          {availableCities.map((cityName) => (
            <option key={cityName} value={cityName} className="dark:bg-flora-950 dark:text-dust-50">
              {cityName}
            </option>
          ))}
          {/* If the current city is not in the list (legacy custom city), keep it visible as an option */}
          {value.city && !availableCities.includes(value.city) && (
            <option value={value.city} className="dark:bg-flora-950 dark:text-dust-50">{value.city}</option>
          )}
        </select>
        <FormError message={errorCity} />
      </label>
    </div>
  );
}
