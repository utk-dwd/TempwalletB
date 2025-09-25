// src/components/layout/RightPanel.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useEffect, useMemo, useState } from 'react';
// Removed Local USDC demo configurators per requirement (no visible UI controls)

export function RightPanel() {
  // No local USDC UI state or effects

  return (
    <div className="w-[320px] space-y-4">

      <div className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4">
        <Button className="w-full rounded-lg">Donate in Gas Tank</Button>
      </div>
      <div className="bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex justify-center">
        <Badge className="bg-success-green text-white rotate-45">Gas Tank</Badge>
      </div>

      {/* Local USDC Demo configurators removed intentionally */}
    </div>
  );
}