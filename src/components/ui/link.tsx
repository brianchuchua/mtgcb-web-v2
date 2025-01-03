'use client';

import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

interface LinkProps extends Omit<MuiLinkProps, 'href'> {
  href: string;
  activeClassName?: string;
  className?: string;
  naked?: boolean;
}

export function Link({
  href,
  activeClassName = 'active',
  className: classNameProps,
  naked,
  ...other
}: LinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const className = clsx(classNameProps, {
    [activeClassName]: isActive,
  });

  if (naked) {
    return (
      <NextLink href={href} className={className} {...other}>
        {other.children}
      </NextLink>
    );
  }

  return (
    <MuiLink
      component={NextLink}
      className={className}
      href={href}
      sx={{ textDecoration: 'none' }}
      {...other}
    />
  );
}
