import {
  LayoutDashboard,
  Radio,
  MessagesSquare,
  ChartArea,
  Activity,
  Trophy,
  ShieldCheck,
  Settings,
  Crown,
  Gem,
  Sunrise,
  Target,
  Flame,
  Medal,
  Rocket,
  Brain,
  Moon,
  Waves,
  HeartHandshake,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  LayoutDashboard,
  Radio,
  MessagesSquare,
  ChartArea,
  Activity,
  Trophy,
  ShieldCheck,
  Settings,
  Crown,
  Gem,
  Sunrise,
  Target,
  Flame,
  Medal,
  Rocket,
  Brain,
  Moon,
  Waves,
  HeartHandshake,
  BadgeCheck,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = REGISTRY[name] ?? LayoutDashboard;
  return <Cmp className={className} />;
}
