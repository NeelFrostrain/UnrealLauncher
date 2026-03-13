import React from "react";
import { Sidebar, Titlebar } from "../components";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen bg-black text-white p-px overflow-hidden select-none">
      <div className="w-full h-full bg-white/10 p-0.5">
        <div className="w-full h-full bg-black/50 p-0.5">
          <div className="w-full h-full bg-[#242424] flex flex-col">
            <Titlebar />
            <div className="flex-1 flex min-h-0">
              <Sidebar />
              <div className="flex-1 min-h-0 p-3.5 overflow-auto">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutWrapper;
