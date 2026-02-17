import type { ComponentProps } from 'react';
import { Puzzle } from 'lucide-react';
import {
  siCloudflare,
  siFacebook,
  siGoogleanalytics,
  siGoogletagmanager,
  siMeta,
  siNginx,
  siShopify,
  siWordpress,
  siWoocommerce,
} from 'simple-icons';

type SimpleIcon = {
  title: string;
  path: string;
  viewBox?: string;
};

function iconSvg(icon: SimpleIcon, props: ComponentProps<'svg'>) {
  const { className, ...rest } = props;
  return (
    <svg
      aria-hidden
      viewBox={icon.viewBox ?? '0 0 24 24'}
      className={className}
      fill="currentColor"
      {...rest}
    >
      <path d={icon.path} />
    </svg>
  );
}

function getIconForTechName(name: string): SimpleIcon | null {
  const key = name.trim().toLowerCase();

  // CMS
  if (key === 'wordpress') return siWordpress;

  // E-commerce
  if (key === 'shopify') return siShopify;
  if (key === 'woocommerce') return siWoocommerce;

  // Analytics
  if (key === 'google analytics') return siGoogleanalytics;
  if (key === 'google tag manager') return siGoogletagmanager;

  // Pixel tools (best-effort)
  if (key === 'meta pixel') return siMeta;
  if (key === 'facebook pixel') return siFacebook;

  // Hosting / CDN / server
  if (key === 'cloudflare') return siCloudflare;
  if (key === 'nginx') return siNginx;

  return null;
}

export function TechLogo(
  props: { name: string } & Omit<ComponentProps<'span'>, 'children'>,
) {
  const { name, className, ...rest } = props;
  const icon = getIconForTechName(name);

  if (!icon) {
    return (
      <span className={className} {...rest}>
        <Puzzle className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  }

  return (
    <span className={className} {...rest}>
      {iconSvg(icon, { className: 'h-3.5 w-3.5' })}
    </span>
  );
}
