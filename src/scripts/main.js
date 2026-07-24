import "@fontsource/marcellus";

import "../styles/base.css";
import "../styles/global.css";
import "../styles/hero.css";
import "../styles/lead.css";
import "../styles/look.css";
import "../styles/staff-credit.css";
import "../styles/catalog.css";
import "../styles/ec.css";
import "../styles/footer.css";

import { initScrollAnimations } from "./animations.js";
import { initSlider } from "./slider.js";

document.addEventListener("DOMContentLoaded", () => {
  initSlider();
  initScrollAnimations();
});
