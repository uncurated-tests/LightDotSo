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

use crate::notifier::Notifier;
use clap::Parser;
use eyre::Result;
use lightdotso_tracing::tracing::info;

#[derive(Debug, Clone, Parser, Default)]
pub struct NotifierArgs {
    /// The webhook endpoint to connect to.
    #[clap(long, env = "DISCORD_WEBHOOK")]
    pub webhook: Option<String>,
}

impl NotifierArgs {
    pub async fn run(&self) -> Result<()> {
        // Add info
        info!("NotifierArgs run, starting...");

        // Print the config
        info!("Config: {:?}", self);

        let notifier = Notifier::new(self).await;

        notifier.run().await;

        Ok(())
    }
}
