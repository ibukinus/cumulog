import type { ButtonHTMLAttributes } from 'react'
import styles from './ui.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={[styles.button, styles[variant], className].filter(Boolean).join(' ')} {...props} />
}
