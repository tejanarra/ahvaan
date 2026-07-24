import Image from "next/image";
import { RsvpModal } from "./rsvp-modal";

export default function Home() {
  return (
    <div
      className="bg-[#f7ecf7] bg-cover bg-center lg:h-screen lg:overflow-hidden"
      style={{ backgroundImage: "url(/4.png)" }}
    >
      <main className="flex flex-col items-center justify-center gap-6 px-4 py-8 lg:h-full lg:gap-8 lg:py-6">
        <div className="flex flex-col items-center gap-2 lg:flex-row lg:items-stretch lg:gap-0 lg:h-[78vh]">
          <Image
            src="/left.jpg"
            alt="Swathi weds Sri Sai Teja — invitation, page one"
            width={768}
            height={1024}
            priority
            className="h-auto w-full max-w-sm rounded-2xl object-contain shadow-[0_20px_60px_-25px_rgba(138,98,21,0.45)] lg:h-full lg:w-auto lg:max-w-none lg:rounded-r-none lg:rounded-l-2xl"
          />
          <Image
            src="/right.jpg"
            alt="Wedding details, page two"
            width={763}
            height={1024}
            priority
            className="h-auto w-full max-w-sm rounded-2xl object-contain shadow-[0_20px_60px_-25px_rgba(138,98,21,0.45)] lg:h-full lg:w-auto lg:max-w-none lg:rounded-l-none lg:rounded-r-2xl lg:border-l lg:border-gold/30"
          />
        </div>

        <RsvpModal />
      </main>
    </div>
  );
}
