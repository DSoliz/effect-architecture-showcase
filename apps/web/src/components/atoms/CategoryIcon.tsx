import type { Category } from "@/lib/domain";

interface CategoryIconProps {
  category: Category;
  size?: number;
}

function AppetizerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Small bowl with steam */}
      <path d="M16 36h32c0 8-7.2 14-16 14S16 44 16 36z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="36" x2="50" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 28c0-3 2-4 0-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 26c0-3 2-4 0-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 28c0-3 2-4 0-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MainIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Plate with dome/cloche */}
      <ellipse cx="32" cy="44" rx="22" ry="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 44c0-16 8.9-28 20-28s20 12 20 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="12" x2="32" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="10" r="2" fill="currentColor" />
    </svg>
  );
}

function SideIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* French fries in a container */}
      <path d="M20 28h24l-3 22H23L20 28z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="26" y1="18" x2="25" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="15" x2="32" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="18" x2="39" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function DrinkIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glass with straw */}
      <path d="M20 18h24l-4 34H24L20 18z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="18" y1="18" x2="46" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="10" x2="33" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DessertIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cupcake */}
      <path d="M20 34h24l-3 18H23L20 34z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18 34c0-8 6-14 14-14s14 6 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="18" r="2.5" fill="currentColor" />
    </svg>
  );
}

const iconMap: Record<Category, (props: { size: number }) => React.JSX.Element> = {
  appetizer: AppetizerIcon,
  main: MainIcon,
  side: SideIcon,
  drink: DrinkIcon,
  dessert: DessertIcon,
};

export function CategoryIcon({ category, size = 48 }: CategoryIconProps) {
  const Icon = iconMap[category];
  return <Icon size={size} />;
}
