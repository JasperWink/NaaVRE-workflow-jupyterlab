import { TypographyVariant } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export function TooltipOverflowLabel({
  label,
  variant
}: {
  label: string;
  variant?: TypographyVariant;
}) {
  const [isOverflowed, setIsOverflow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current &&
      setIsOverflow(ref.current.scrollWidth > ref.current.clientWidth);
  }, []);

  return (
    <Tooltip
      title={label}
      disableHoverListener={!isOverflowed}
      placement="bottom"
      arrow
    >
      <Typography
        variant={variant}
        ref={ref}
        sx={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}
      >
        {label}
      </Typography>
    </Tooltip>
  );
}
