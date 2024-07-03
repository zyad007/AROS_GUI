import Home from "@renderer/pages/Home";
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";

export default function AppRouter() {
  return (
    <HashRouter>
      <div className="w-screen h-screen flex flex-col justify-start items-center">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/settings" element={<>Settings</>} />
          <Route path="*" element={<>Not Found</>} />
        </Routes>
      </div>
    </HashRouter>
  )
}
