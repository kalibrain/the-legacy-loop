import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    ignores: ["example-chat-ui.js", "example-chat-ui.*"],
  },
];

export default config;
