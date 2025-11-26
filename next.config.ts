/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // 린트(Lint) 에러 무시하기 (사용 안 한 변수 등)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
