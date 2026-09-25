const PROXY_CONFIG = [
  {
    context: ["/api", "/coastcontracts/api", "/coastcontracts/hc"],
    target: "http://localhost:5000",
    secure: false,
    logLevel: "error",
    pathRewrite: {
      "^/coastcontracts": "",
    },
  },
];

module.exports = PROXY_CONFIG;
