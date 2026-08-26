import {
  getDirectional,
  ILinkDefaultProps,
  IPosition
} from '@mrblenny/react-flow-chart';
import * as React from 'react';

export const generateCurvePathCustom = (
  startPos: IPosition,
  endPos: IPosition
): string => {
  const { width, height, topToBottom, leftToRight, isHorizontal } =
    getDirectional(startPos, endPos);

  const start = startPos;
  const end = endPos;
  const mid: IPosition = {
    x: start.x + ((leftToRight ? 1 : -1) * width) / 2,
    y: start.y + ((topToBottom ? 1 : -1) * height) / 2
  };

  const curveX =
    (leftToRight ? 1 : -1) * (isHorizontal ? width / 5 : height / 5);
  const curveY = 0;

  return `
    M${start.x},${start.y}
    C ${start.x + curveX},${start.y + curveY} ${mid.x},${mid.y} ${mid.x},${mid.y}
    C ${mid.x},${mid.y} ${end.x - curveX},${end.y - curveY} ${end.x},${end.y}
    `;
};

export const LinkCustom = (props: ILinkDefaultProps) => {
  const {
    className,
    link,
    config,
    isHovered,
    isSelected,
    startPos,
    endPos,
    fromPort,
    onLinkMouseEnter,
    onLinkMouseLeave,
    onLinkClick
  } = props;
  const points = generateCurvePathCustom(startPos, endPos);

  const linkColor: string =
    (fromPort.properties && fromPort.properties.linkColor) || 'cornflowerblue';

  return (
    <svg
      style={{
        overflow: 'visible',
        position: 'absolute',
        cursor: 'pointer',
        left: 0,
        right: 0
      }}
      className={className}
    >
      <defs>
        <marker
          id={`arrowHead-${linkColor}`}
          orient="auto-start-reverse"
          markerWidth="2"
          markerHeight="4"
          refX="0.1"
          refY="2"
        >
          <path d="M0,0 V4 L2,2 Z" fill={linkColor} />
        </marker>
      </defs>
      {/* Main line */}
      <path
        d={points}
        stroke={linkColor}
        strokeWidth="3"
        fill="none"
        markerMid={`url(#arrowHead-${linkColor})`}
      />
      {/* Thick line to make selection easier */}
      <path
        d={points}
        stroke={linkColor}
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
        strokeOpacity={isHovered || isSelected ? 0.1 : 0}
        onMouseEnter={() => onLinkMouseEnter({ config, linkId: link.id })}
        onMouseLeave={() => onLinkMouseLeave({ config, linkId: link.id })}
        onClick={e => {
          onLinkClick({ config, linkId: link.id });
          e.stopPropagation();
        }}
      />
    </svg>
  );
};
