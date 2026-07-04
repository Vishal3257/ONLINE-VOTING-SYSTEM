/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // When a user visits the root URL
        source: '/',
        // Permanently redirect them to the login page
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
