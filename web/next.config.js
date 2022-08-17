/** @type {import('next').NextConfig} */

const path = require("path");

module.exports = {
  swcMinify: true,
  reactStrictMode: true,
  webpack(config, options) {
    config.resolve.modules = [path.resolve(__dirname), "node_modules"];
    return config;
  },
};
