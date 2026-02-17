import { Badge } from '@/components/base/badge';
import { TechLogo } from '@/components/scan/tech-logo';

type TechTag = {
  name: string;
  category?: string;
  confidence?: string;
  version?: string;
  evidence?: string;
  evidenceList?: string[];
};

export function TechBadge(props: { tag: TechTag }) {
  const { tag } = props;

  const displayName = tag.version ? `${tag.name} ${tag.version}` : tag.name;
  const evidenceItems = Array.isArray(tag.evidenceList)
    ? tag.evidenceList
    : tag.evidence
      ? [tag.evidence]
      : [];
  const evidenceSummary = evidenceItems
    .map((e) => String(e).trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  const title = tag.category
    ? `${displayName} • ${tag.category}${tag.confidence ? ` • ${tag.confidence}` : ''}${evidenceSummary ? ` • evidence: ${evidenceSummary}` : ''}`
    : `${displayName}${evidenceSummary ? ` • evidence: ${evidenceSummary}` : ''}`;

  return (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-normal"
      title={title}
    >
      <TechLogo
        name={tag.name}
        className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
      />
      <span>{displayName}</span>
    </Badge>
  );
}
