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

import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { cache } from "react";

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const getEnsName = cache(async (address: `0x${string}`) => {
  if (!address) return;
  const ensName = await publicClient.getEnsName({
    address,
  });
  return ensName;
});

export const preload = (address: `0x${string}`) => {
  void getEnsName(address);
};

export async function EnsName({
  params: { address },
}: {
  params: { address: `0x${string}` };
}) {
  const name = await getEnsName(address);
  if (name) {
    return <p>{name}</p>;
  }
}
