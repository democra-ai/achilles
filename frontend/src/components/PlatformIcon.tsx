/**
 * Renders a platform logo.
 * Priority: local SVG (dashboard-icons) → simple-icons inline SVG → letter avatar fallback.
 */
import {
  siGitlab,
  siGoogle,

  siAnthropic,
  siHuggingface,
  siStripe,
  siNpm,
  siPypi,
  siApple,
  siDigitalocean,
  siGooglecloud,
  siRailway,
  siReplicate,
  siElevenlabs,
  siNewrelic,
  siRollbar,
  siRender,
  siResend,
  siExpo,
  siClerk,
  siAuth0,
  siMixpanel,
  siAlgolia,
  siCloudinary,
  siContentful,
  siSanity,
  siPrismic,
  siPusher,
  siTurso,
  siUpstash,
  siPlanetscale,
  siAdyen,
  siPaddle,
  siLemonsqueezy,
  siVonage,
  siIntercom,
  siRedis,
  siCockroachlabs,
  siBackblaze,
  siMeilisearch,
  siStrapi,
  siGoogleanalytics,
  siPlausibleanalytics,
  siMapbox,
  siSquare,
  siHotjar,
  siFathom,
  siConvex,
  siFauna,
  siHere,
  siTomtom,
  siX,
  siTiktok,
  siPosthog,
} from "simple-icons";

type SimpleIcon = { path: string; hex: string; title: string };

/** Returns true for near-black brand colors that are invisible in dark mode */
function isVeryDark(hex: string): boolean {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 60;
}

// Local SVGs that are dark/black paths — invisible in dark mode → apply invert
const DARK_INVERT_IDS = new Set([
  "openai", "github", "notion", "twitter", "sentry", "vercel", "linear", "okta", "zendesk",
]);

// Local SVG with white fills — invisible in light mode → wrap in brand-colored bg
const WHITE_ICON_IDS: Record<string, string> = {
  ibm: "#1F70C1",
};

// Platforms with a local SVG in /icons/{id}.svg (dashboard-icons)
const LOCAL_ICON_IDS = new Set([
  "openai", "aws", "cloudflare", "netlify", "flyio", "github", "discord",
  "slack", "datadog", "linear", "sentry", "supabase", "vercel", "mongodb",
  "paypal", "sendgrid", "mailgun", "perplexity", "mistral",
  "deepseek", "neon",
  "airtable", "azure", "elasticsearch", "facebook", "figma", "firebase",
  "gemini", "grafana", "hetzner", "ibm", "jira", "linkedin", "linode",
  "notion", "okta", "pagerduty", "shopify", "twitter", "vultr",
  "wordpress", "zendesk",
]);

// simple-icons fallback
const SIMPLE_ICON_MAP: Record<string, SimpleIcon> = {
  apple: siApple,
  gitlab: siGitlab,
  google: siGoogle,
  anthropic: siAnthropic,
  huggingface: siHuggingface,
  stripe: siStripe,
  npm: siNpm,
  pypi: siPypi,
  digitalocean: siDigitalocean,
  gcp: siGooglecloud,
  googlecloud: siGooglecloud,
  railway: siRailway,
  xai: siX,
  replicate: siReplicate,
  elevenlabs: siElevenlabs,
  newrelic: siNewrelic,
  rollbar: siRollbar,
  render: siRender,
  resend: siResend,
  expo: siExpo,
  clerk: siClerk,
  auth0: siAuth0,
  mixpanel: siMixpanel,
  algolia: siAlgolia,
  cloudinary: siCloudinary,
  contentful: siContentful,
  sanity: siSanity,
  prismic: siPrismic,
  pusher: siPusher,
  turso: siTurso,
  upstash: siUpstash,
  planetscale: siPlanetscale,
  adyen: siAdyen,
  paddle: siPaddle,
  lemonsqueezy: siLemonsqueezy,
  vonage: siVonage,
  intercom: siIntercom,
  redis: siRedis,
  cockroachdb: siCockroachlabs,
  backblaze: siBackblaze,
  meilisearch: siMeilisearch,
  strapi: siStrapi,
  googleanalytics: siGoogleanalytics,
  plausible: siPlausibleanalytics,
  mapbox: siMapbox,
  square: siSquare,
  hotjar: siHotjar,
  fathom: siFathom,
  convex: siConvex,
  fauna: siFauna,
  here: siHere,
  tomtom: siTomtom,
  tiktok: siTiktok,
  posthog: siPosthog,
};

// Brand colors for letter-avatar fallback
const FALLBACK_COLORS: Record<string, string> = {
  groq: "#F55036",
  cohere: "#39594D",
  together: "#0096FF",
  stability: "#7B2FFF",
  fireworks: "#FF6500",
  voyage: "#7B42FF",
  fal: "#000000",
  heroku: "#430098",
  twilio: "#F22F46",
  segment: "#52BD95",
  amplitude: "#0066FF",
  ably: "#FF5416",
  postmark: "#FFDD00",
  weaviate: "#5C4EE5",
  pinecone: "#00B680",
  s3_compatible: "#FF9900",
  typesense: "#E3562A",
  logrocket: "#764ABC",
  onesignal: "#E54B4D",
  appsflyer: "#5E00C4",
  branchio: "#18A0FB",
  nextauth: "#191919",
  stytch: "#4A5F8C",
  kinde: "#3C1FC0",
  workos: "#FF5B00",
  xata: "#FF2D3B",
  qdrant: "#DC244C",
  bunny: "#FC7B03",
  imagekit: "#0099FF",
  uploadthing: "#DC2626",
  openweather: "#E96E4C",
  revenuecat: "#E74E3E",
  googlemaps: "#4285F4",
};

interface PlatformIconProps {
  platformId: string;
  color?: string;
  size?: number;
  className?: string;
}

export function PlatformIcon({
  platformId,
  color,
  size = 16,
  className,
}: PlatformIconProps) {
  const id = platformId.toLowerCase();

  // 1. Local dashboard-icons SVG
  if (LOCAL_ICON_IDS.has(id)) {
    // White-fill icons need a brand-colored background to be visible in light mode
    const bgColor = WHITE_ICON_IDS[id];
    if (bgColor) {
      return (
        <span
          className={className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size,
            height: size,
            borderRadius: 3,
            backgroundColor: bgColor,
            flexShrink: 0,
          }}
        >
          <img
            src={`/icons/${id}.svg`}
            alt={platformId}
            width={size - 2}
            height={size - 2}
            style={{ objectFit: "contain" }}
          />
        </span>
      );
    }

    // Dark icons (black paths) need inversion in dark mode (default), cleared in light mode
    const needsInvert = DARK_INVERT_IDS.has(id);
    return (
      <img
        src={`/icons/${id}.svg`}
        alt={platformId}
        width={size}
        height={size}
        className={[className, needsInvert ? "icon-invert-on-dark" : ""]
          .filter(Boolean)
          .join(" ")}
        style={{ flexShrink: 0, objectFit: "contain" }}
      />
    );
  }

  // 2. simple-icons inline SVG
  const icon = SIMPLE_ICON_MAP[id];
  if (icon) {
    const dark = !color && isVeryDark(icon.hex);
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color ?? (dark ? "currentColor" : `#${icon.hex}`)}
        aria-label={icon.title}
        className={[className, dark ? "si-dark-icon" : ""].filter(Boolean).join(" ")}
        style={{ flexShrink: 0 }}
      >
        <path d={icon.path} />
      </svg>
    );
  }

  // 3. Letter avatar fallback
  const fallbackColor = color ?? FALLBACK_COLORS[id] ?? "#888888";
  const letter = platformId.charAt(0).toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-label={platformId}
      className={className}
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill={fallbackColor} />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {letter}
      </text>
    </svg>
  );
}
