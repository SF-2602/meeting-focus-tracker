// utils/getAppIcon.ts
const SIMPLE_ICONS_MAP: Record<string, string> = {
  whatsapp: "whatsapp",
  telegram: "telegram",
  signal: "signal",
  slack: "slack",
  discord: "discord",
  "microsoft teams": "microsoftteams",
  teams: "microsoftteams",

  "google chrome": "googlechrome",
  chrome: "googlechrome",
  firefox: "firefox",
  safari: "safari",
  "microsoft edge": "microsoftedge",
  edge: "microsoftedge",
  brave: "brave",
  opera: "opera",

  "visual studio code": "visualstudiocode",
  vscode: "visualstudiocode",
  code: "visualstudiocode",
  "intellij idea": "intellijidea",
  intellij: "intellijidea",
  pycharm: "jetbrains",
  webstorm: "jetbrains",
  phpstorm: "jetbrains",
  "sublime text": "sublimetext",
  atom: "atom",

  zoom: "zoom",
  "google meet": "googlemeet",
  meet: "googlemeet",
  skype: "skype",
  facetime: "facetime",

  // Social Media
  twitter: "x",
  x: "x",
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
  youtube: "youtube",
  tiktok: "tiktok",
  reddit: "reddit",

  notion: "notion",
  trello: "trello",
  jira: "jira",
  asana: "asana",
  gmail: "gmail",
  outlook: "microsoftoutlook",

  spotify: "spotify",
  netflix: "netflix",
  "amazon prime video": "amazonprimevideo",
  "prime video": "amazonprimevideo",
  steam: "steam",
  "epic games": "epicgames",

  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  docker: "docker",
  npm: "npm",
  "node.js": "nodedotjs",
  python: "python",
  react: "react",
  "vue.js": "vue.js",
  angular: "angular",
  typescript: "typescript",
  javascript: "javascript",
};

export const getAppIconUrl = (appName: string): string | null => {
  if (!appName) return null;

  const normalizedApp = appName.toLowerCase().trim();

  if (normalizedApp.includes("code") && !normalizedApp.includes("codec")) {
    return "https://code.visualstudio.com/assets/images/code-icon.svg";
  }

  if (SIMPLE_ICONS_MAP[normalizedApp]) {
    return `https://cdn.simpleicons.org/${SIMPLE_ICONS_MAP[normalizedApp]}`;
  }

  for (const [key, slug] of Object.entries(SIMPLE_ICONS_MAP)) {
    if (normalizedApp.includes(key)) {
      return `https://cdn.simpleicons.org/${slug}`;
    }
  }

  if (normalizedApp.includes("whatsapp"))
    return "https://cdn.simpleicons.org/whatsapp";
  if (normalizedApp.includes("chrome"))
    return "https://cdn.simpleicons.org/googlechrome";
  if (normalizedApp.includes("firefox"))
    return "https://cdn.simpleicons.org/firefox";
  if (normalizedApp.includes("safari"))
    return "https://cdn.simpleicons.org/safari";
  if (normalizedApp.includes("zoom")) return "https://cdn.simpleicons.org/zoom";
  if (normalizedApp.includes("teams"))
    return "https://cdn.simpleicons.org/microsoftteams";
  if (normalizedApp.includes("youtube"))
    return "https://cdn.simpleicons.org/youtube";
  if (normalizedApp.includes("spotify"))
    return "https://cdn.simpleicons.org/spotify";
  if (normalizedApp.includes("telegram"))
    return "https://cdn.simpleicons.org/telegram";
  if (normalizedApp.includes("discord"))
    return "https://cdn.simpleicons.org/discord";

  // If no match found, return null (will use fallback emoji)
  return null;
};
