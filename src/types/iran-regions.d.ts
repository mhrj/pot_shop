declare module 'iran-regions' {
  import type React from 'react';

  export interface ProvinceCity {
    province: string;
    city: string;
  }

  export interface ProvinceCitySelectProps {
    value?: ProvinceCity;
    defaultValue?: ProvinceCity;
    onChange?: (value: ProvinceCity) => void;
    onProvinceChange?: (province: string) => void;
    onCityChange?: (city: string) => void;
    theme?: 'light' | 'dark' | 'modern' | 'minimal' | 'ocean';
    customTheme?: Record<string, string | number>;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'outlined' | 'filled' | 'underlined' | 'borderless';
    direction?: 'ltr' | 'rtl';
    isRequired?: boolean;
    isDisabled?: boolean;
    readonly?: boolean;
    clearable?: boolean;
    placeholders?: {
      province?: string;
      city?: string;
    };
    labels?: {
      province?: string;
      city?: string;
    };
    validation?: {
      required?: boolean | { message: string };
      custom?: (value: ProvinceCity) => string | null;
    };
    showErrorMessages?: boolean;
    errorMessages?: {
      provinceRequired?: string;
      cityRequired?: string;
    };
    className?: string;
    selectorType?: 'select' | 'autocomplete' | 'combobox';
    style?: React.CSSProperties;
    containerClassName?: string;
    containerStyle?: React.CSSProperties;
    groupClassName?: string;
    groupStyle?: React.CSSProperties;
    provinceClassName?: string;
    provinceInputStyle?: React.CSSProperties;
    cityClassName?: string;
    cityInputStyle?: React.CSSProperties;
    errorClassName?: string;
    errorStyle?: React.CSSProperties;
    provinces?: Array<{ name: string; cities: string[] }>;
    onBlur?: (e: React.FocusEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
  }

  export const ProvinceCitySelect: React.FC<ProvinceCitySelectProps>;
  export const ThemeProvider: React.FC<any>;
  export const applyTheme: (theme: any) => void;
  export const useTheme: () => any;
  export const themes: any;
  export const defaultDataSource: any;
  export const DataSource: any;
  export const FlexibleInput: any;
}

declare module 'iran-regions/styles' {
  const content: any;
  export default content;
}
