import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between pt-16 pb-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="h-[94px] w-[187.5px] self-center"
          src="/lightwk_logo_white.png"
          alt="Next.js logo"
          width={1125}
          height={564}
          priority
        />

      </main>
    </div>
  );
}