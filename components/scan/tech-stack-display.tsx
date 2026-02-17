import { TechBadge } from '@/components/scan/tech-badge';
import type { TechTag } from '@/lib/audit/tech';
import {
  Layers,
  Server,
  ShoppingCart,
  BarChart3,
  Database,
  Globe,
  Box,
  Code2,
  Cpu,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/base/card';

type TechStackDisplayProps = {
  tags: TechTag[];
};

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; priority: number }
> = {
  framework: {
    label: 'Frameworks',
    icon: <Layers className="h-4 w-4" />,
    priority: 1,
  },
  cms: { label: 'CMS', icon: <Database className="h-4 w-4" />, priority: 2 },
  ecommerce: {
    label: 'E-commerce',
    icon: <ShoppingCart className="h-4 w-4" />,
    priority: 3,
  },
  analytics: {
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    priority: 4,
  },
  server: {
    label: 'Server',
    icon: <Server className="h-4 w-4" />,
    priority: 5,
  },
  hosting: {
    label: 'Hosting',
    icon: <Globe className="h-4 w-4" />,
    priority: 6,
  },
  cdn: { label: 'CDN', icon: <Globe className="h-4 w-4" />, priority: 7 },
  language: {
    label: 'Languages',
    icon: <Code2 className="h-4 w-4" />,
    priority: 8,
  },
  library: {
    label: 'Libraries',
    icon: <Box className="h-4 w-4" />,
    priority: 9,
  },
  other: { label: 'Other', icon: <Cpu className="h-4 w-4" />, priority: 10 },
};

export function TechStackDisplay({ tags }: TechStackDisplayProps) {
  if (!tags || tags.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No technologies detected.
      </p>
    );
  }

  // Group tags by category
  const grouped = tags.reduce(
    (acc, tag) => {
      const cat = tag.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tag);
      return acc;
    },
    {} as Record<string, TechTag[]>,
  );

  // Sort categories by priority
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const pA = CATEGORY_CONFIG[a]?.priority ?? 99;
    const pB = CATEGORY_CONFIG[b]?.priority ?? 99;
    return pA - pB;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedCategories.map((category) => {
        const config = CATEGORY_CONFIG[category] ?? {
          label: category,
          icon: <Cpu className="h-4 w-4" />,
        };

        return (
          <Card key={category} className="h-full">
            <CardHeader className="py-3 bg-muted/20 border-b">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="text-muted-foreground">{config.icon}</span>
                {config.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-wrap gap-2">
              {grouped[category].map((tag) => (
                <TechBadge
                  key={`${tag.name}-${tag.category}`}
                  tag={{ ...tag, name: tag.name }}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
