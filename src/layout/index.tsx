import React from "react";
import { Sidebar } from "../components";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen bg-black text-white p-px overflow-hidden">
      <div className="w-full h-full bg-white/10 p-0.5">
        <div className="w-full h-full bg-black/50 p-0.5">
          <div className="w-full h-full bg-[#242424] flex">
            <Sidebar />
            <div className="flex-1 h-full p-3.5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutWrapper;
