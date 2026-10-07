import { useCallback, useState } from "react";
import { Cursor } from "./components/common/Cursor";
import { Footer } from "./components/common/Footer";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { MainContainer } from "./components/common/MainContainer";
import { Navbar } from "./components/navigation/Navbar";
import { About } from "./components/sections/About";
import { Achievements } from "./components/sections/Achievements";
import { Contact } from "./components/sections/Contact";
import { Education } from "./components/sections/Education";
import { Experience } from "./components/sections/Experience";
import { Hero } from "./components/sections/Hero";
import { Projects } from "./components/sections/Projects";
import { TechStack } from "./components/sections/TechStack";
import { WhatIDo } from "./components/sections/WhatIDo";
import { useDeviceCapabilities } from "./hooks/useDeviceCapabilities";

/**
 * APP
 * ===
 * Single-page, anchor-navigated — no router, no backend.
 *
 * `booted` is the one piece of global state: it flips when the preloader
 * finishes and is what releases the hero entrance, the navbar entrance, the
 * scroll-reveal system and the WebGL canvas, so the whole intro runs as one
 * orchestrated sequence instead of several competing ones.
 *
 * Section order is defined in src/config/site.ts and mirrored here.
 */
export default function App() {
  const [booted, setBooted] = useState(false);

  // Sets `data-quality` on <html> as early as possible.
  useDeviceCapabilities();

  const onLoaded = useCallback(() => setBooted(true), []);

  return (
    <>
      {!booted ? <LoadingScreen onComplete={onLoaded} /> : null}

      <Cursor />
      <Navbar booted={booted} />

      <MainContainer booted={booted}>
        <Hero booted={booted} />
        <About />
        <WhatIDo />
        <TechStack />
        <Projects />
        <Experience />
        <Education />
        <Achievements />
        <Contact />
      </MainContainer>

      <Footer />
    </>
  );
}
