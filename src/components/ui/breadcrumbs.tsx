'use client';

import { Box, Breadcrumbs as MuiBreadcrumbs, Link as MuiLink, SxProps, Theme, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  autoGenerate?: boolean;
  sx?: SxProps<Theme>;
  includeHome?: boolean;
}

export default function Breadcrumbs({ items, autoGenerate = false, sx = {}, includeHome = false }: BreadcrumbsProps) {
  const pathname = usePathname();

  let breadcrumbs = items || (autoGenerate ? generatePathBreadcrumbs(pathname) : []);

  if (includeHome && items && items.length > 0 && items[0].label !== 'Home') {
    breadcrumbs = [{ label: 'Home', href: '/' }, ...breadcrumbs];
  }

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        mb: 2,
        overflow: 'hidden',
        ...sx
      }}
      data-testid="breadcrumbs"
    >
      <MuiBreadcrumbs
        separator=">"
        aria-label="breadcrumbs"
        sx={{
          '.MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
            alignItems: 'center',
          },
          '.MuiBreadcrumbs-separator': {
            marginLeft: '8px',
            marginRight: '8px',
          },
        }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return isLast ? (
            <Typography
              color="text.primary"
              key={crumb.label}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '300px',
              }}
            >
              {crumb.label}
            </Typography>
          ) : (
            <MuiLink
              component={Link}
              href={crumb.href || '#'}
              key={crumb.label}
              underline="hover"
              color="inherit"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px',
              }}
            >
              {crumb.label}
            </MuiLink>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}

function generatePathBreadcrumbs(path: string): BreadcrumbItem[] {
  if (!path || path === '/') {
    return [{ label: 'Home', href: '/' }];
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  const pathSegments = path.split('/').filter(Boolean);

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      href: index === pathSegments.length - 1 ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}
