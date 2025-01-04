pub mod battle_net {
    use crate::config::Config;
    use crate::helpers::{self, Error};
    use serde_json::json;
    use std::fs;
    use std::io::Read;
    use std::process::Command;

    const CONFIG_FILE: &str = "Battle.net.config";

    pub fn set_background(config: &Config, id: Option<&str>) -> Result<(), Error> {
        let battle_net_was_closed = helpers::close_battle_net();
        let battle_net_config = config.battle_net.config.clone().unwrap();
        let battle_net_cleanup: Box<dyn FnOnce()> = Box::new(move || {
            if battle_net_was_closed {
                Command::new(config.battle_net.install.clone().unwrap())
                    .spawn()
                    .ok();
            }
        });

        // Open Battle.net.config file
        let mut file = match fs::OpenOptions::new()
            .read(true)
            .open(battle_net_config.clone())
        {
            Ok(file) => file,
            Err(e) => {
                battle_net_cleanup();
                return Err(Error::Custom(format!(
                    "Failed to open the [[{}]] file at [[{}]]: {}",
                    CONFIG_FILE, battle_net_config, e
                )));
            }
        };
        let mut contents = String::new();
        match file.read_to_string(&mut contents) {
            Ok(_) => {}
            Err(e) => {
                battle_net_cleanup();
                return Err(Error::Custom(format!(
                    "Failed to read [[{}]] file at [[{}]]: {}",
                    CONFIG_FILE, battle_net_config, e
                )));
            }
        }

        // Parse Battle.net.config file
        let mut json: serde_json::Value = match serde_json::from_str(&contents) {
            Ok(json) => json,
            Err(e) => {
                battle_net_cleanup();
                return Err(Error::Custom(format!(
                    "Failed to parse [[{}]] file at [[{}]]: {}",
                    CONFIG_FILE, battle_net_config, e
                )));
            }
        };

        // Check Overwatch installation on Battle.net
        let overwatch_config = match json
            .get_mut("Games")
            .and_then(|games| games.get_mut("prometheus"))
        {
            Some(config) => config,
            None => {
                battle_net_cleanup();
                return Err(Error::Custom(
                    "Unable to find an Overwatch installation on Battle.net.".to_string(),
                ));
            }
        };

        // Get launch arguments config
        let launch_args = match overwatch_config.get_mut("AdditionalLaunchArguments") {
            Some(launch_args) => launch_args.as_str(),
            None => {
                overwatch_config
                    .as_object_mut()
                    .unwrap()
                    .insert("AdditionalLaunchArguments".to_string(), json!(""));
                overwatch_config.as_str()
            }
        };

        // Check and create AdditionalLaunchArguments if it doesn't exist
        let new_launch_args = helpers::get_launch_args(launch_args, id);
        json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(new_launch_args);

        helpers::safe_json_write(battle_net_config, &json)?;
        battle_net_cleanup();

        Ok(())
    }
}

pub mod steam {
    use crate::config::Config;
    use crate::helpers::{self, Error};
    use std::os::windows::process::CommandExt; // NOTE: Windows only
    use std::process::Command;

    pub fn set_background(config: &Config, id: Option<&str>) -> Result<(), Error> {
        let steam_configs = config.steam.configs.clone().unwrap();
        if steam_configs.is_empty() {
            return Err(Error::Custom(
                "Failed to find any accounts in your Steam userdata folder.".into(),
            ));
        }

        let steam_was_closed = helpers::close_steam();
        let steam_cleanup: Box<dyn FnOnce()> = Box::new(move || {
            if steam_was_closed {
                Command::new("cmd")
                    .args(["/C", "start", "steam://open/games/details/2357570"])
                    .creation_flags(0x0800_0000)
                    .spawn()
                    .ok();
            }
        });

        println!("Steam background set to id: {:?}", id);

        // Modify each Steam localconfig.vdf file
        // let mut success = false;
        // for steam_config in steam_configs {
        //     println!("here {}", steam_config.id);

        //     // TODO: handle case when Ovewatch is not installed
        //     let result =
        //         helpers::set_steam_launch_options(steam_config.file.as_str(), id);

        //     match result {
        //         Ok(_) => {
        //             println!("success for {}", steam_config.id);
        //             success = true;
        //         }
        //         Err(e) => {
        //             steam_cleanup();
        //             steam_error = Some(e);
        //             break 'steam;
        //         }
        //     };
        // }
        // println!("success {}", success);

        steam_cleanup();

        Ok(())
    }
}
