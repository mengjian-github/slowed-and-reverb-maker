import { Chivo } from "next/font/google";

// The site's one face: Chivo, weight 400/700/900, uppercase headings.
export const chivo = Chivo({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});
