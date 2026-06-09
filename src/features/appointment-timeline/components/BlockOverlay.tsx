import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Block } from '../types';
import { STATUS_COLORS } from '../constants';
import { Tooltip } from './Tooltip';

interface BlockOverlayProps {
  block: Block;
  top: number;
  height: number;
  width: number;
  theme?: 'light' | 'dark';
  onClick?: () => void;
}

export function BlockOverlay({
  block,
  top,
  height,
  width,
  theme = 'light',
  onClick,
}: BlockOverlayProps) {
  const isDark = theme === 'dark';
  const colors = STATUS_COLORS.BLOCKED;

  const stripeStyle = useMemo(
    () => ({
      backgroundColor: isDark ? colors.bgDark : colors.bgLight,
      backgroundImage: `repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        ${isDark ? colors.stripeDark : colors.stripeLight} 4px,
        ${isDark ? colors.stripeDark : colors.stripeLight} 8px
      )`,
    }),
    [isDark, colors],
  );

  const timeRange = `${format(block.startAt, 'HH:mm')} - ${format(block.endAt, 'HH:mm')}`;

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-semibold">Horario bloqueado</div>
      <div className="opacity-75">{timeRange}</div>
      {block.notes && <div className="opacity-60 italic">{block.notes}</div>}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} theme={theme}>
      <div
        onClick={onClick}
        className={`absolute z-[5] rounded border ${colors[isDark ? 'dark' : 'light']} ${
          onClick ? 'cursor-pointer' : 'cursor-default'
        } transition-all hover:shadow-md hover:z-10`}
        style={{
          top,
          height,
          width,
          minHeight: 20,
          ...stripeStyle,
        }}
      >
        <div className="p-1.5 text-[10px] font-medium truncate opacity-80">
          {block.notes || 'Bloqueado'}
        </div>
      </div>
    </Tooltip>
  );
}
