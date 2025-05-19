import React from 'react';
import type { JSX } from 'react';
import styled, { css } from 'styled-components';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'code';
type TypographyAlign = 'left' | 'center' | 'right';

interface TypographyProps {
  variant?: TypographyVariant;
  color?: string;
  align?: TypographyAlign;
  gutterBottom?: boolean;
  noWrap?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantMapping: Record<TypographyVariant, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  code: 'code',
};

const StyledTypography = styled.div<Omit<TypographyProps, 'children'>>`
  margin: 0;
  padding: 0;
  color: ${props => props.color || 'var(--text-primary)'};
  text-align: ${props => props.align || 'left'};
  
  ${props => props.gutterBottom && css`
    margin-bottom: 0.75em;
  `}
  
  ${props => props.noWrap && css`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
  
  ${props => {
    switch (props.variant) {
      case 'h1':
        return css`
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.01em;
        `;
      case 'h2':
        return css`
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.005em;
        `;
      case 'h3':
        return css`
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
        `;
      case 'h4':
        return css`
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
        `;
      case 'h5':
        return css`
          font-size: 1.125rem;
          font-weight: 500;
          line-height: 1.5;
        `;
      case 'h6':
        return css`
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.5;
        `;
      case 'body2':
        return css`
          font-size: 0.875rem;
          font-weight: 400;
          line-height: 1.6;
        `;
      case 'caption':
        return css`
          font-size: 0.75rem;
          font-weight: 400;
          line-height: 1.5;
          color: ${props.color || 'var(--text-secondary)'};
        `;
      case 'code':
        return css`
          font-family: 'Roboto Mono', monospace;
          font-size: 0.875rem;
          background-color: var(--foreground);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-weight: 400;
        `;
      default:
        return css`
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.6;
        `;
    }
  }}
`;

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color,
  align = 'left',
  gutterBottom = false,
  noWrap = false,
  className,
  children,
}) => {
  const Component = variantMapping[variant] || 'p';

  return (
    <StyledTypography
      as={Component}
      variant={variant}
      color={color}
      align={align}
      gutterBottom={gutterBottom}
      noWrap={noWrap}
      className={className}
    >
      {children}
    </StyledTypography>
  );
};
