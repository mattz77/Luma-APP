import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

type ExternalLinkProps = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

export function ExternalLink({ href, ...rest }: ExternalLinkProps) {
  const typedHref = href as React.ComponentProps<typeof Link>['href'];

  return (
    <Link
      target="_blank"
      href={typedHref}
      {...rest}
      onPress={(event) => {
        if (Platform.OS !== 'web') {
          event.preventDefault();
          void WebBrowser.openBrowserAsync(href);
        }
      }}
    />
  );
}
