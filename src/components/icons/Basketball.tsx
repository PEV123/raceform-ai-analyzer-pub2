import { SVGProps } from "react";

export const Basketball = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-basketball"
    {...props}
  >
    <circle cx="12" cy="12" r="10"/>
    <path d="M2.1 13.4A10.1 10.1 0 0 0 13.4 2.1"/>
    <path d="m5 4.9 14 14.2"/>
    <path d="M21.9 10.6a10.1 10.1 0 0 0-11.3 11.3"/>
  </svg>
);