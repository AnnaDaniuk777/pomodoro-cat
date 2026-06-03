type IconButtonProps = {
  icon: string;
  alt?: string;
  ariaLabel?: string;
  onClick?: () => void;
  className?: string;
};

/**
 * Reusable button that renders a single PNG icon.
 * Shared hover/active feedback lives in the `.icon-btn` CSS rule
 * (defined in app/styles/global.css).
 */
export function IconButton({
  icon,
  alt = '',
  ariaLabel,
  onClick,
  className,
}: IconButtonProps) {
  const classes = className ? `icon-btn ${className}` : 'icon-btn';
  return (
    <button
      type="button"
      className={classes}
      aria-label={ariaLabel ?? alt}
      onClick={onClick}
    >
      <img src={icon} alt={alt} />
    </button>
  );
}
