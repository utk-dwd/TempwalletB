// src/components/layout/RightPanel.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function RightPanel() {
  return (
    <div className="w-[320px] space-y-4">
      <div className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4">
        <Button className="w-full rounded-lg">Donate in Gas Tank</Button>
      </div>
      <div className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex justify-center">
        <Badge className="bg-success-green text-white rotate-45">Gas Tank</Badge>
      </div>
    </div>
  );
}