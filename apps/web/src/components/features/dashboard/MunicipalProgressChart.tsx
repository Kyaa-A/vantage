'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


interface StatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
}

interface MunicipalProgressChartProps {
  data: StatusData[];
  totalBarangays: number;
}

const statusConfig = {
  'Validated': { color: 'var(--analytics-success-text)', bgColor: 'var(--analytics-success-bg)' },
  'Submitted for Review': { color: 'var(--kpi-blue-text)', bgColor: 'var(--kpi-blue-from)' },
  'In Rework': { color: 'var(--analytics-warning-text)', bgColor: 'var(--analytics-warning-bg)' },
  'In Progress': { color: 'var(--kpi-purple-text)', bgColor: 'var(--kpi-purple-from)' },
  'Not Started': { color: 'var(--analytics-neutral-text)', bgColor: 'var(--analytics-neutral-bg)' },
};

export function MunicipalProgressChart({ data, totalBarangays }: MunicipalProgressChartProps) {
  return (
    <Card className="bg-[var(--card)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-[var(--foreground)]">
            Live Status of All Barangays
          </CardTitle>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Distribution of {totalBarangays} barangays across assessment stages
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const config = statusConfig[item.status as keyof typeof statusConfig] || 
                          { color: 'var(--analytics-neutral-text)', bgColor: 'var(--analytics-neutral-bg)' };
            
            return (
              <TooltipProvider key={item.status}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group cursor-pointer p-4 rounded-sm bg-[var(--hover)] backdrop-blur-sm border border-[var(--border)] hover:border-[var(--border)] hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-semibold px-3 py-1 rounded-sm"
                            style={{
                              backgroundColor: config.bgColor,
                              color: config.color
                            }}
                          >
                            {item.status}
                          </Badge>
                          <span className="text-lg font-bold text-[var(--foreground)]">
                            {item.count}
                          </span>
                          <span className="text-sm text-[var(--muted-foreground)]">barangays</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-[var(--foreground)]">
                            {item.percentage}%
                          </span>
                          <div className="text-xs text-[var(--muted-foreground)]">of total</div>
                        </div>
                      </div>
                      
                      <div className="relative w-full h-3 bg-[var(--border)] rounded-sm overflow-hidden shadow-inner">
                        <div
                          className="h-full transition-all duration-1000 ease-out rounded-sm"
                          style={{ 
                            backgroundColor: config.bgColor,
                            width: `${item.percentage}%` 
                          }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[var(--card)] backdrop-blur-sm border border-[var(--border)] shadow-xl">
                    <div className="text-center p-2">
                      <p className="font-semibold text-[var(--foreground)]">{item.status}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {item.count} Barangays ({item.percentage}%)
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center justify-between bg-[var(--hover)] rounded-sm p-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--kpi-blue-text)' }}
              ></div>
              <span className="text-sm font-medium text-[var(--foreground)]">Total Barangays: {totalBarangays}</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--analytics-success)' }}
              ></div>
              <span className="text-sm text-[var(--muted-foreground)]">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 