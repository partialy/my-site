import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4 py-24 text-center text-[#f4f5f7]">
      <p className="font-mono text-sm font-semibold text-[#e5a93c]">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#f4f5f7]">
        页面不存在
      </h1>
      <p className="mt-3 text-sm text-[#9499a6]">
        你访问的页面或作品可能已被移除或地址有误。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-[#f4f5f7] px-5 text-sm font-medium text-[#08090c] transition-colors hover:bg-white"
      >
        返回展厅首页
      </Link>
    </div>
  );
}
