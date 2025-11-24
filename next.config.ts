/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 타입스크립트 에러 무시하기 (중요!)
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. 린트(Lint) 에러 무시하기 (사용 안 한 변수 등)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
