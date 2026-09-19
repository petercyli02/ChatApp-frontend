import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Check, Monitor, Moon, Sun } from "lucide-react";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

interface Props {
  className?: string;
}

/**
 * LESSON: The icon is a crossfade, not a conditional render.
 *
 * `{isDark ? <Moon/> : <Sun/>}` swaps instantly and looks cheap. Instead both
 * icons are always mounted, stacked on top of each other in the same grid cell,
 * and we animate scale + rotation + opacity between them. The `dark:` variants
 * do the switching, so React re-renders nothing when the theme changes - the
 * class on <html> is enough.
 */
const ThemeToggle = ({ className }: Props) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className={cn("cursor-pointer", className)}
          aria-label={`Theme: ${theme} (currently ${resolvedTheme})`}
        >
          <span className="grid place-items-center">
            <Sun className="col-start-1 row-start-1 size-5 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="col-start-1 row-start-1 size-5 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer"
          >
            <Icon />
            <span className="flex-1">{label}</span>
            {theme === value && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
