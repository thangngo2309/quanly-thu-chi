import type { ValueTransformer } from 'typeorm';

export const numericTransformer: ValueTransformer = {
  to: (value?: number | null): number | null => {
    if (value === undefined || value === null) {
      return null;
    }

    return Number(value);
  },

  from: (value?: string | number | null): number => {
    if (value === undefined || value === null) {
      return 0;
    }

    return Number(value);
  },
};
