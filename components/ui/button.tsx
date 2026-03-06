import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary hover:bg-primary/90 text-primary-foreground border border-transparent shadow-sm',
  secondary: 'bg-card hover:bg-secondary text-foreground border border-border',
  danger:    'bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-transparent shadow-sm',
  ghost:     'bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground border border-transparent',
  success:   'bg-success hover:bg-success/90 text-success-foreground border border-transparent shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm:  'px-3 py-1.5 text-xs rounded-md min-h-[32px]',
  md:  'px-4 py-2 text-sm rounded-lg min-h-[40px]',
  lg:  'px-5 py-2.5 text-base rounded-lg min-h-[44px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-ring/40 focus:ring-offset-1 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin -ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
})
