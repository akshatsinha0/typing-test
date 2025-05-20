import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  outline: none;
  border: none;
  position: relative;
  overflow: hidden;
  
  ${props => props.$fullWidth && css`
    width: 100%;
  `}
  
  ${props => {
    switch (props.$size) {
      case 'sm':
        return css`
          font-size: 0.875rem;
          padding: 0.375rem 0.75rem;
          height: 2rem;
        `;
      case 'lg':
        return css`
          font-size: 1.125rem;
          padding: 0.75rem 1.5rem;
          height: 3rem;
        `;
      default:
        return css`
          font-size: 1rem;
          padding: 0.5rem 1rem;
          height: 2.5rem;
        `;
    }
  }}
  
  ${props => {
    switch (props.$variant) {
      case 'secondary':
        return css`
          background-color: var(--foreground);
          color: var(--text-primary);
          &:hover {
            background-color: rgba(var(--accent-rgb), 0.1);
          }
        `;
      case 'ghost':
        return css`
          background-color: transparent;
          color: var(--text-primary);
          &:hover {
            background-color: rgba(var(--accent-rgb), 0.1);
          }
        `;
      case 'danger':
        return css`
          background-color: var(--error);
          color: white;
          &:hover {
            background-color: rgba(var(--error-rgb), 0.9);
          }
        `;
      default:
        return css`
          background-color: var(--accent);
          color: white;
          &:hover {
            background-color: rgba(var(--accent-rgb), 0.9);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    top: 0;
    left: -100%;
    transform: skewX(-10deg);
    transition: all 0.4s ease;
  }
  
  &:hover::after {
    left: 100%;
  }
`;

const LoadingSpinner = styled.span`
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  loading = false,
  disabled,
  ...rest
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          {children}
        </>
      ) : (
        <>
          {icon && icon}
          {children}
        </>
      )}
    </StyledButton>
  );
};
