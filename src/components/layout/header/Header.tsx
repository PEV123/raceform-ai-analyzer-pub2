import { Link } from "react-router-dom";
import { TextLogo } from "@/components/brand/TextLogo";
import { MobileNav } from "../sidebar/MobileNav";
import { AdminMenu } from "./AdminMenu";
import { UserMenu } from "./UserMenu";

export const Header = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link to="/">
            <TextLogo />
          </Link>
        </div>
        <div className="flex-1 flex justify-end items-center gap-4">
          <AdminMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};