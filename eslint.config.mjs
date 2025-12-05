import nextConfig from "eslint-config-next";

export default [
  // ...nextConfig // This would be ideal if it supported flat config
  {
    ignores: [".next/*"]
  }
];
