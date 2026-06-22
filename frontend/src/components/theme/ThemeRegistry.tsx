'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import {
  type ReactNode,
  useState,
} from 'react';

type ThemeRegistryProps = {
  children: ReactNode;
};

export function ThemeRegistry({
  children,
}: ThemeRegistryProps) {
  const [{ cache, flush }] = useState(
    () => {
      const cache = createCache({
        key: 'mui',
        prepend: true,
      });

      cache.compat = true;

      const previousInsert =
        cache.insert;

      let insertedNames: string[] =
        [];

      cache.insert = (
        ...args
      ) => {
        const serialized = args[1];

        if (
          cache.inserted[
            serialized.name
          ] === undefined
        ) {
          insertedNames.push(
            serialized.name,
          );
        }

        return previousInsert(
          ...args,
        );
      };

      const flush = (): string[] => {
        const names =
          insertedNames;

        insertedNames = [];

        return names;
      };

      return {
        cache,
        flush,
      };
    },
  );

  useServerInsertedHTML(() => {
    const names = flush();

    if (names.length === 0) {
      return null;
    }

    const styles = names
      .map((name) => {
        const insertedStyle =
          cache.inserted[name];

        return typeof insertedStyle ===
          'string'
          ? insertedStyle
          : '';
      })
      .join('');

    return (
      <style
        data-emotion={`${cache.key} ${names.join(
          ' ',
        )}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      {children}
    </CacheProvider>
  );
}