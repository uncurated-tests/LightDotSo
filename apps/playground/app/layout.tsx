// Copyright (C) 2023 Light, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { Button, TrpcProvider } from "@lightdotso/ui";
import Link from "next/link";
import "./globals.css";
import { getAuthSession } from "@lightdotso/next-auth";
import { cn } from "@lightdotso/utils";
import { Inter as FontSans } from "next/font/google";
import { headers } from "next/headers";
import { SideNav } from "../src/components/sidebar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  return (
    <html lang="en">
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          fontSans.variable,
        )}
      >
        <TrpcProvider headers={headers()}>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 w-full border-b bg-background">
              <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                <div className="flex items-center space-x-4">
                  <Button asChild variant="ghost" className="gap-2">
                    <Link href="/">
                      <svg
                        viewBox="0 0 512 512"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                      >
                        <rect
                          width="512"
                          height="512"
                          rx="150"
                          fill="#398CCB"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M255.446 75L326.523 116.008V138.556L412.554 188.238V273.224L435.631 286.546V368.608L364.6 409.615L333.065 391.378L256.392 435.646L180.178 391.634L149.085 409.615L78.0538 368.538V286.546L100.231 273.743V188.238L184.415 139.638L184.462 139.636V116.008L255.446 75ZM326.523 159.879V198.023L255.492 239.031L184.462 198.023V160.936L184.415 160.938L118.692 198.9V263.084L149.085 245.538L220.115 286.546V368.538L198.626 380.965L256.392 414.323L314.618 380.712L293.569 368.538V286.546L364.6 245.538L394.092 262.565V198.9L326.523 159.879ZM312.031 357.969V307.915L355.369 332.931V382.985L312.031 357.969ZM417.169 307.846L373.831 332.862V382.985L417.169 357.9V307.846ZM96.5154 357.9V307.846L139.854 332.862V382.915L96.5154 357.9ZM201.654 307.846L158.315 332.862V382.915L201.654 357.9V307.846ZM321.262 291.923L364.6 266.908L407.938 291.923L364.6 316.962L321.262 291.923ZM149.085 266.838L105.746 291.923L149.085 316.892L192.423 291.923L149.085 266.838ZM202.923 187.362V137.308L246.215 162.346V212.377L202.923 187.362ZM308.015 137.308L264.723 162.346V212.354L308.015 187.362V137.308ZM212.154 121.338L255.446 96.3231L298.785 121.338L255.446 146.354L212.154 121.338Z"
                          fill="white"
                        />
                      </svg>
                      <span className="text-lg font-semibold">
                        tRPC Next 13 Playground
                      </span>
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-4">
                  <nav className="flex items-center space-x-2">
                    <Button asChild size="icon" variant="ghost">
                      <Link href="https://github.com/trpc/trpc/tree/main/examples/.experimental/next-app-dir">
                        <GitHubLogoIcon className="h-5 w-5" />
                        <span className="sr-only">GitHub</span>
                      </Link>
                    </Button>
                    <Button asChild size="icon" variant="ghost">
                      <Link href="https://twitter.com/trpcio">
                        <TwitterLogoIcon className="h-5 w-5" />
                        <span className="sr-only">Twitter</span>
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link
                        href={
                          session ? "/api/auth/signout" : "/api/auth/signin"
                        }
                      >
                        {session ? "Sign out" : "Sign in"}
                      </Link>
                    </Button>
                  </nav>
                </div>
              </div>
            </header>
            <div className="container flex">
              <SideNav>{children}</SideNav>
            </div>
          </div>
        </TrpcProvider>
      </body>
    </html>
  );
}
