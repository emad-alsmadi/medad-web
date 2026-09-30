import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { useTheme, type Theme } from '@/contexts/theme-context';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'فاتح' },
  { value: 'dark', label: 'داكن' },
];

export function ThemeCard() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle id="theme-label">المظهر</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          ألوان الموقع فاتحة أو داكنة، ويُحفظ الاختيار على هذا المتصفح.
        </p>
        <ChoiceChips
          id="theme"
          aria-labelledby="theme-label"
          options={OPTIONS}
          value={theme}
          onChange={(next) => {
            const option = OPTIONS.find((o) => o.value === next);
            if (option) setTheme(option.value);
          }}
        />
      </CardContent>
    </Card>
  );
}
