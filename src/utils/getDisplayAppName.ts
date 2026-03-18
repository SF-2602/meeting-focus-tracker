export const getDisplayAppName = (
  app: string,
  title: string,
  category: string,
): string => {
  const lowerApp = app.toLowerCase();

  const isBrowser = [
    "chrome",
    "firefox",
    "safari",
    "edge",
    "brave",
    "opera",
    "vivaldi",
  ].some((browser) => lowerApp.includes(browser));

  if (!isBrowser) return app;

  const meetingServices: Array<[RegExp, string]> = [
    [/meet\.google\.com|google meet/i, "Google Meet"],
    [/zoom\.us\/[jw]\//i, "Zoom"],
    [/teams\.microsoft\.com|microsoft teams/i, "Microsoft Teams"],
    [/webex\.com/i, "Webex"],
    [/whereby\.com/i, "Whereby"],
    [/jitsi\.meet/i, "Jitsi"],
    [/bluejeans\.com/i, "BlueJeans"],
  ];

  if (category === "meeting") {
    for (const [pattern, name] of meetingServices) {
      if (pattern.test(title) || pattern.test(app)) {
        return name;
      }
    }
  }

  if (category === "instant_message") {
    const imServices: Array<[RegExp, string]> = [
      [/slack\.com/i, "Slack"],
      [/discord\.com/i, "Discord"],
      [/web\.whatsapp\.com|whatsapp/i, "WhatsApp"],
      [/messenger\.com/i, "Messenger"],
      [/telegram\.org/i, "Telegram"],
    ];
    for (const [pattern, name] of imServices) {
      if (pattern.test(title)) {
        return name;
      }
    }
  }

  return app.split("\\").pop()?.split("/").pop()?.split(".")[0] || app;
};