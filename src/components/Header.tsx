import { Instrument_Serif } from "next/font/google";
import { Instrument_Sans } from "next/font/google";

const instrumentSerif = Instrument_Serif({ 
  weight: "400", 
  subsets: ["latin"] 
});
const instrumentSans = Instrument_Sans({ 
  weight: "400", 
  subsets: ["latin"] 
});
// components/Header.js
export default function Header() {
  return (
    <header className="w-full fixed top-0 z-50">
      <h1 className={`
        w-full py-4 px-6
        backdrop-blur-md bg-white/10 
        text-white text-[24pt] 
        border-b border-white/30
        shadow-lg 
        hover:bg-white/20 
        transition-all duration-300 ease-in-out
        ${instrumentSerif.className} font-bold 
        relative overflow-hidden
        flex items-center justify-center
      `}>
        <span className="relative">
          <span className="opacity-90">VISUM</span>
          <span className="opacity-80 ml-3 text-[18pt] font-light">By Frushion</span>
          <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
        </span>
      </h1>
    </header>
  );
}
