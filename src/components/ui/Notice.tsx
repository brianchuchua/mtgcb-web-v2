'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { IconButton } from '@mui/material';
import { SxProps, Theme, alpha, darken, lighten, styled } from '@mui/material/styles';
import { HTMLAttributes, ReactNode } from 'react';

// The site's message box. Replaces MUI Alert.
//   error:   something failed, or a warning before something that cannot be undone
//   warning: needs a look (a result with problems, an expired link)
//   info:    state worth knowing
//   success: a result
//   note:    help text, tips, logged-out and empty states
export const Notice = ({ kind = 'info', title, icon, action, onClose, children, ...rest }: NoticeProps) => (
  <Root kind={kind} data-kind={kind} role={kind === 'error' || kind === 'warning' ? 'alert' : 'status'} {...rest}>
    {icon !== false && <IconSlot kind={kind}>{icon ?? ICONS[kind]}</IconSlot>}
    <Body>
      {title && <Title>{title}</Title>}
      {children !== undefined && children !== null && children !== false && <Text>{children}</Text>}
    </Body>
    {action && <Action>{action}</Action>}
    {onClose && (
      <IconButton size="small" onClick={onClose} aria-label="close" sx={{ mt: '-3px', color: 'inherit', opacity: 0.8 }}>
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>
    )}
  </Root>
);

export type NoticeKind = 'error' | 'warning' | 'info' | 'success' | 'note';

export interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  kind?: NoticeKind;
  title?: ReactNode;
  // Pass false for no icon.
  icon?: ReactNode | false;
  // Sits on the right. Use a text button.
  action?: ReactNode;
  onClose?: () => void;
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

const ICONS: Record<NoticeKind, ReactNode> = {
  error: <ErrorOutlineIcon />,
  warning: <WarningAmberIcon />,
  info: <InfoOutlinedIcon />,
  success: <CheckCircleOutlineIcon />,
  note: <LightbulbOutlinedIcon />,
};

// Info uses the primary blue: the site has one blue.
const paletteFor = (theme: Theme, kind: Exclude<NoticeKind, 'note'>) => {
  if (kind === 'error') return theme.palette.error;
  if (kind === 'warning') return theme.palette.warning;
  if (kind === 'success') return theme.palette.success;
  return theme.palette.primary;
};

const forward = (prop: PropertyKey) => prop !== 'kind';

// MUI's standard dark Alert colours: a near-black shade of the colour behind light text in the colour.
const Root = styled('div', { shouldForwardProp: forward })<{ kind: NoticeKind }>(({ theme, kind }) => {
  const color = kind === 'note' ? null : paletteFor(theme, kind);
  // The palest blue is nearly white already, so the blue box starts from the main blue and lightens its text less.
  // Otherwise it is the brightest box on the page.
  const info = kind === 'info';
  const base = color ? (info ? color.main : color.light) : null;
  const text = base ? lighten(base, info ? 0.35 : 0.6) : theme.palette.text.secondary;
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 14,
    lineHeight: '20px',
    color: text,
    backgroundColor: base ? darken(base, 0.9) : alpha(theme.palette.common.black, 0.3),
    boxShadow: `inset 0 0 0 1px ${alpha(color ? color.main : theme.palette.text.primary, color ? 0.28 : 0.12)}`,
    // Links take the box's own text colour. The underline marks them as links.
    '& a': { color: 'inherit', textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 2 },
  };
});

const IconSlot = styled('span', { shouldForwardProp: forward })<{ kind: NoticeKind }>(({ theme, kind }) => ({
  display: 'flex',
  flexShrink: 0,
  color: kind === 'note' ? theme.palette.text.secondary : paletteFor(theme, kind).main,
  '& svg': { width: 20, height: 20, fontSize: 20, display: 'block' },
}));

const Body = styled('div')({ flex: 1, minWidth: 0 });

const Title = styled('div')({ fontWeight: 600 });

const Text = styled('div')({ overflowWrap: 'anywhere' });

const Action = styled('div')({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  marginTop: -5,
  marginBottom: -5,
});

// A text button for a Notice's action slot, coloured to match the box.
export const noticeActionSx = { textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' } as const;

export default Notice;
