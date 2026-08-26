import React, { CSSProperties, ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { IPortDefaultProps } from '@mrblenny/react-flow-chart';

function PortDefaultOuter({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '20px',
        height: '20px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {children}
    </div>
  );
}

function PortDot({ color }: { color: CSSProperties['color'] }) {
  return (
    <div
      style={{
        width: '20px',
        height: '20px',
        background: color,
        borderRadius: '50%',
        cursor: 'pointer'
      }}
    />
  );
}

function PortLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-block',
        maxWidth: '100px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginLeft: '5px',
        marginRight: '5px',
        fontSize: '13px'
      }}
    >
      {children}
    </div>
  );
}

export const PortCustom = (props: IPortDefaultProps) => {
  const isSpecialNode =
    props.port.properties.parentNodeType !== 'workflow-cell';

  const positionStyle = props.port.type === 'left' ? { left: 0 } : { right: 0 };

  return (
    <PortDefaultOuter>
      <Tooltip title={props.port.id} placement="bottom" arrow>
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            ...positionStyle
          }}
        >
          {isSpecialNode ? (
            <PortDot color="#3C8F49" />
          ) : (
            <>
              {props.port.type === 'right' && (
                <PortLabel>{props.port.id}</PortLabel>
              )}
              <PortDot color={props.port.properties.color} />
              {props.port.type === 'left' && (
                <PortLabel>{props.port.id}</PortLabel>
              )}
            </>
          )}
        </div>
      </Tooltip>
    </PortDefaultOuter>
  );
};
