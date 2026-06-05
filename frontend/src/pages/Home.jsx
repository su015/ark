import HeroPhysics from "@/components/sections/HeroPhysics";
import PartnerMarquee from "@/components/sections/PartnerMarquee";
import Manifesto from "@/components/sections/Manifesto";
import WorkGallery from "@/components/sections/WorkGallery";
import Services from "@/components/sections/Services";
import VideoShowcase from "@/components/sections/VideoShowcase";
import Studio from "@/components/sections/Studio";
import MegaFooter from "@/components/sections/MegaFooter";
import FloatingCTA from "@/components/FloatingCTA";

export default function Home() {
  const scrollToContact = () => {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <HeroPhysics />
      <PartnerMarquee />
      <Manifesto />
      <WorkGallery />
      <Services />
      <VideoShowcase />
      <Studio />
      <MegaFooter />
      <FloatingCTA onClick={scrollToContact} />
    </>
  );
}
