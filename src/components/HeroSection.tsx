import { useEffect, useState } from "react";

// HOME IMAGES
import img1 from "../assets/slide-1.png";
import img2 from "../assets/slide-2.png";
import img3 from "../assets/Property 1=slide-6.png";
import img4 from "../assets/Property 1=slide-7.png";
import img5 from "../assets/slide-5.png";

// ABOUT IMAGES (apni images daal lena)
import about1 from "../assets/slide1.png";
import about2 from "../assets/slide2.png";
import about3 from "../assets/Property 1=slide-6.png";
import about4 from "../assets/Property 1=slide-7.png";


const homeSlides = [
  { image: img1 },
  { image: img2 },
  { image: img3 },
  { image: img4 },
  { image: img5 },
];

const aboutSlides = [{ image: about1 }, { image: about2 }, { image: about3 }, { image: about4 }];

export default function HeroSection({ variant = "home" }) {
  const [current, setCurrent] = useState(0);

  const slides = variant === "about" ? aboutSlides : homeSlides;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[460px] rounded-3xl overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ${index === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
        >
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}
