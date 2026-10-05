export default function Logo({ size = 32, className = '' }) {
  return (
    <img
      src="/logo.png"
      alt="Expense Review logo"
      width={size}
      height={size}
      className={`rounded-lg object-contain ${className}`}
    />
  );
}