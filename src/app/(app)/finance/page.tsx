import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { vi } from "@/i18n/vi";

export default function PlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{vi.nav.finance}</CardTitle>
        <CardDescription>{vi.placeholders.phaseCDesc}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {vi.common.empty}
      </CardContent>
    </Card>
  );
}
