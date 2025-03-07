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

// eslint-disable-next-line import/no-named-as-default
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";
import { prisma } from "@lightdotso/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { getAddress } from "viem";
import GitHub from "next-auth/providers/github";

// Check if we are using https, only use secure cookies in deployment
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");
const hostName = new URL(process.env.NEXTAUTH_URL!).hostname;

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  adapter: PrismaAdapter(prisma),
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  // secret: process.env.NEXTAUTH_SECRET ?? process.env.NEXT_PUBLIC_SECRET,
  secret: "secret",
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.warn("signIn", { user, account, profile, email, credentials });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.warn("redirect", { url, baseUrl });
      return baseUrl;
    },
    async jwt({ token, user, account, profile }) {
      console.warn("jwt", { token, user, account, profile });
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.warn("session", { session, token });
      session.token = token;
      session.token.expires = session.expires;
      session.id = token.sub;
      session.user.address = session.user.name;
      session.user.image = "/";
      session.address = session.user.name || "";
      session.chainId = 1;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: hostName == "localhost" ? hostName : "." + hostName,
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    GitHub({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clientId: process.env.GITHUB_ID!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      id: "eth",
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials, req) {
        console.info("authorize", { credentials, req });

        try {
          // Convert the message to a siwe message
          const siwe = new SiweMessage(
            JSON.parse(credentials?.message || "{}"),
          );

          // FIXME: Check if the host matches
          // // Get the next auth url
          // const nextAuthUrl =
          //   process.env.VERCEL_ENV === "production" ||
          //   process.env.VERCEL_ENV === "development"
          //     ? process.env.NEXTAUTH_URL
          //     : `https://${process.env.VERCEL_URL}`;
          // if (!nextAuthUrl) {
          //   throw new Error("Invalid URL");
          // }
          // const nextAuthHost = new URL(nextAuthUrl).host;
          // console.info("NextAuthHost", nextAuthHost);

          // Check if the nonce matches
          if (
            siwe.nonce !==
            (await getCsrfToken({ req: { headers: req?.headers } }))
          ) {
            return null;
          }

          // Check if siwe is valid
          const result = await siwe.verify({
            signature: credentials?.signature!,
          });

          // FIXME: Check if the host matches
          // // Check if the domain matches
          // if (result.data.domain !== nextAuthHost) {
          //   console.error("Domain Mismatch", result.data.domain, nextAuthHost);
          //   throw new Error("Domain Mismatch");
          // }

          // Check if the statement matches
          if (
            result.data.statement !== process.env.NEXT_PUBLIC_SIGNIN_MESSAGE
          ) {
            console.error("Statement Mismatch", result.data.statement);
            throw new Error("Statement Mismatch");
          }

          // Check if the signature is valid
          if (!result.success) {
            console.error("Invalid Signature", result.error);
            throw new Error("Invalid Signature");
          }

          // Log the success
          console.info("Success", result.success);

          // Get the address in checksum format
          const address = getAddress(result.data.address);

          // Check if the account already exists
          const existingAccount = await prisma.account.findFirst({
            where: {
              providerAccountId: address,
            },
            select: {
              userId: true,
              providerAccountId: true,
              user: {
                select: {
                  image: true,
                  name: true,
                },
              },
            },
          });

          // Return existing user and account
          if (existingAccount) {
            return {
              id: existingAccount.userId,
              name: existingAccount.user.name,
              image: existingAccount.user.image,
            };
          }

          // Create new user and account sequentially
          const { user } = await prisma.$transaction(
            async (tx: { user: any; account: any }) => {
              const user = await tx.user.create({
                data: {
                  name: address,
                },
              });
              const account = await tx.account.create({
                data: {
                  userId: user.id,
                  providerType: "credentials",
                  providerId: "eth",
                  providerAccountId: address,
                },
              });
              return {
                user,
                account,
              };
            },
          );

          return {
            id: user.id,
            name: user.name,
          };
        } catch (err) {
          console.error(err);
          return null;
        }
      },
    }),
  ],
};

export const getAuthSession = async () => {
  return await getServerSession(authOptions);
};
