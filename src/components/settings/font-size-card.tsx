import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { useFontSize, type FontSize } from '@/contexts/font-size-context';

const OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'sm', label: 'صغير' },
  { value: 'md', label: 'متوسط' },
  { value: 'lg', label: 'كبير' },
  { value: 'xl', label: 'كبير جدًا' },
];

export function FontSizeCard() {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <Card>
      <CardHeader>
        <CardTitle id="font-size-label">حجم الخط</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          يغيّر حجم النصوص والعناصر في كامل الموقع، ويُحفظ على هذا المتصفح.
        </p>
        <ChoiceChips
          id="font-size"
          aria-labelledby="font-size-label"
          options={OPTIONS}
          value={fontSize}
          onChange={(next) => {
            const option = OPTIONS.find((o) => o.value === next);
            if (option) setFontSize(option.value);
          }}
        />
      </CardContent>
    </Card>
  );
}
