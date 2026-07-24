import { InviteBook } from "./invite-book";

export default function Home() {
  return (
    <div
      className="min-h-dvh bg-[#f7ecf7] bg-cover bg-center"
      style={{ backgroundImage: "url(/4.png)" }}
    >
      <InviteBook />
    </div>
  );
}
