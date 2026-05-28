/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  async redirects() {
    return [
      {
        source: "/community",
        destination: "https://chat.whatsapp.com/IV3kpbV3OVz7FJK8htIPa9",
        permanent: false,
      },
    ];
  },
};
export default nextConfig;
