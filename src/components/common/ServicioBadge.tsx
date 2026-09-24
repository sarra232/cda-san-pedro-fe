import React from 'react';
import { getTipoServicioConfig } from '../../utils/formatters';

interface ServicioBadgeProps {
  tipoServicio?: string | null;
  esReinspeccion?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const ServicioBadge: React.FC<ServicioBadgeProps> = ({
  tipoServicio,
  esReinspeccion,
  size = 'sm',
  showIcon = true,
  fullWidth = false,
  className = '',
}) => {
  const config = getTipoServicioConfig(tipoServicio, esReinspeccion);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] font-bold rounded-md gap-1',
    sm: 'px-2 py-0.5 text-[10px] font-extrabold rounded-lg gap-1.5',
    md: 'px-2.5 py-1 text-xs font-black rounded-xl gap-2',
    lg: 'px-3.5 py-1.5 text-sm font-black rounded-2xl gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 border tracking-wide uppercase transition-all shadow-sm ${
        config.badgeClass
      } ${sizeClasses} ${fullWidth ? 'w-full justify-center' : ''} ${className}`}
      title={`${config.label} - ${config.description}`}
    >
      {showIcon && <span className="text-xs shrink-0 select-none">{config.icon}</span>}
      <span className="truncate">{config.shortLabel}</span>
    </span>
  );
};

export default ServicioBadge;
