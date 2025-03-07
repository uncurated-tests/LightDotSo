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

import { Button } from "@lightdotso/ui";
import { JsonPreTag } from "@/components/json-pretag";
import { http } from "@lightdotso/trpc";

export const ServerHttpGreeting = async () => {
  const greeting1 = await http.playground.greeting.query({
    text: "from server1",
  });
  const greeting2 = await http.playground.greeting.query({
    text: "from server2",
  });
  const secret = await http.playground.secret.query();

  return (
    <div className="space-y-2">
      <JsonPreTag object={{ greeting1, greeting2, secret }} />
      <form
        action={async () => {
          "use server";
          await http.playground.greeting.revalidate();
        }}
      >
        <Button type="submit">Revalidate HTTP</Button>
      </form>
    </div>
  );
};
