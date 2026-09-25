const PROXY_CONFIG = [
  {
    context: ["/api", "/coastcontracts/api", "/coastcontracts/hc"],
    target: "http://localhost:54688",
    secure: false,
    logLevel: "error",
    pathRewrite: {
      "^/coastcontracts": "",
    },
  },
];

module.exports = PROXY_CONFIG;
