module.exports = {
  "**/*!(.(d|spec|test)).{js,jsx,ts,tsx}": [
    "jest --bail --findRelatedTests",
    "eslint --fix",
    "prettier --write"
  ],
  "**/*.(d|spec|test).{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "**/*.{md,json}": ["prettier --write"]
};
