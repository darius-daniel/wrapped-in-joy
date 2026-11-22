import { SignupForm } from "@/components/signup-form";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <Image
        className="dark:invert h-[53.5] w-27.5 self-center"
        src="/lightwk_logo_dark.png"
        alt="Next.js logo"
        width={1125}
        height={564}
        priority
      />
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
