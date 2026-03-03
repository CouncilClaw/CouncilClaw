export const CLI_BANNER = String.raw`
 ██████╗ ██████╗ ██╗   ██╗███╗   ██╗ ██████╗██╗██╗      █████╗ ██╗    ██╗
██╔════╝██╔═══██╗██║   ██║████╗  ██║██╔════╝██║██║     ██╔══██╗██║    ██║
██║     ██║   ██║██║   ██║██╔██╗ ██║██║     ██║██║     ███████║██║ █╗ ██║
██║     ██║   ██║██║   ██║██║╚██╗██║██║     ██║██║     ██╔══██║██║███╗██║
╚██████╗╚██████╔╝╚██████╔╝██║ ╚████║╚██████╗██║███████╗██║  ██║╚███╔███╔╝
 ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝
`;

export function tagline(): string {
  const lines = [
    "Many minds deliberate. One claw executes.",
    "Anonymous council in front, controlled execution in back.",
    "Debate hard, execute safe.",
  ];
  return lines[Math.floor(Math.random() * lines.length)] || lines[0];
}
