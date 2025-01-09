pub mod battle_net {
    use crate::config::Config;
    use crate::helpers::{self, Error};
    use crate::{backgrounds, config};
    use serde_json::json;
    use std::process::Command;
    use sysinfo::System;

    pub static CONFIG_FILE: &str = "Battle.net.config";

    pub fn close_app() -> bool {
        let mut flag = false;
        let system = System::new_all();
        for process in system.processes_by_name("Battle.net.exe".as_ref()) {
            if process.kill() {
                flag = true;
            }
        }

        flag
    }

    pub fn set_launch_args<F, P>(
        config: &Config,
        params: P,
        generate_launch_args: F,
    ) -> Result<(), Error>
    where
        F: Fn(Option<&str>, P) -> String,
    {
        let battle_net_was_closed = close_app();
        let battle_net_config = config.battle_net.config.clone().unwrap();
        let battle_net_cleanup: Box<dyn FnOnce()> = Box::new(move || {
            if battle_net_was_closed {
                Command::new(config.battle_net.install.clone().unwrap())
                    .spawn()
                    .ok();
            }
        });

        // Read config file
        let mut json = read_config(&config)?;

        // Check Overwatch installation on Battle.net
        let overwatch_config = match json
            .get_mut("Games")
            .and_then(|games| games.get_mut("prometheus"))
        {
            Some(config) => config,
            None => {
                battle_net_cleanup();
                return Err(Error::Custom(
                    "Unable to find an Overwatch installation on Battle.net. If you have changed your Battle.net installation, please reset settings.".to_string(),
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

        // Set launch arguments
        let new_launch_args = generate_launch_args(launch_args, params);
        json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(new_launch_args);

        helpers::safe_json_write(battle_net_config, &json)?;
        battle_net_cleanup();

        Ok(())
    }

    /// Updates OverBuddy configuration with the current state of the Battle.net.config file.
    ///
    /// **Warning**: This function modifies the shared configuration fields.
    pub fn update_config(config: &Config) -> Result<Option<config::SharedConfig>, Error> {
        let json = read_config(config)?;
        let mut shared_config = config::SharedConfig {
            background: config::BackgroundConfig {
                current: None,
                is_outdated: false,
            },
            additional: config::AdditionalConfig {
                console_enabled: false,
            },
        };

        if let Some(launch_args) = json
            .get("Games")
            .and_then(|games| games.get("prometheus"))
            .and_then(|overwatch| overwatch.get("AdditionalLaunchArguments"))
            .and_then(|launch_args| launch_args.as_str())
        {
            // Get current background from launch arguments
            let current_background = helpers::get_background(launch_args);

            // TODO: Refactor adding custom
            // if let Some(ref current_background) = current_background {
            //     config.shared.background.current = Some(current_background.clone());

            //     // TODO: When adding custom, check if it was set by the user
            //     if backgrounds::find_background_by_id(current_background).is_none() {
            //         config.shared.background.is_outdated = true;
            //     }
            // }

            // Save current background
            shared_config.background.current =
                current_background
                    .as_ref()
                    .and_then(|current_background_id| {
                        backgrounds::find_background_by_id(current_background_id)
                            .map(|background| background.id.to_string())
                    });
            shared_config.background.is_outdated =
                shared_config.background.current.is_none() && current_background.is_some();

            // Save debug console state
            shared_config.additional.console_enabled = helpers::get_console_enabled(launch_args);
        }
        //  else {
        //     // Reset current background
        //     shared_config.background.current = None;
        //     shared_config.background.is_outdated = false;
        //     // Reset debug console state
        //     shared_config.additional.console_enabled = false;
        // }

        Ok(Some(shared_config))
    }

    fn read_config(config: &Config) -> Result<serde_json::Value, Error> {
        let battle_net_config = config.battle_net.config.clone().unwrap();

        // Read and parse Battle.net.config file
        let file = match std::fs::File::open(&battle_net_config) {
            Ok(file) => file,
            Err(e) => {
                return Err(Error::Custom(format!(
                    "Failed to open [[{}]] file at [[{}]]: {}. If you have changed your Battle.net installation, please reset settings.",
                    CONFIG_FILE,
                    battle_net_config,
                    e
                )));
            }
        };
        let json: serde_json::Value = match serde_json::from_reader(file) {
            Ok(json) => json,
            Err(e) => {
                return Err(Error::Custom(format!(
                    "Failed to read [[{}]] file at [[{}]]: {}",
                    CONFIG_FILE, battle_net_config, e
                )));
            }
        };

        Ok(json)
    }
}

pub mod steam {
    use crate::backgrounds;
    use crate::config::{self, Config, SteamProfile};
    use crate::helpers::{self, Error};
    use similar::{ChangeTag, TextDiff};
    use std::collections::VecDeque;
    use std::fs::{self, File};
    use std::io::{self, BufRead, BufReader, Read, Write};
    use std::os::windows::process::CommandExt; // NOTE: Windows only
    use std::path::Path;
    use std::process::Command;
    use sysinfo::System;

    pub fn close_app() -> bool {
        let mut flag = false;
        let system = System::new_all();
        for process in system.processes_by_name("steam.exe".as_ref()) {
            if process.kill() {
                flag = true;
            }
        }

        flag
    }

    pub fn get_profiles(config: &Config) -> Result<Vec<SteamProfile>, Error> {
        let mut profiles: Vec<SteamProfile> = vec![];

        if let Some(available_configs) = &config.steam.configs {
            for steam_config in available_configs {
                let config_path = Path::new(&steam_config.file);

                if !config_path.exists() {
                    continue;
                }

                let contents = match fs::read_to_string(config_path) {
                    Ok(contents) => contents,
                    Err(err) => {
                        return Err(Error::Custom(format!(
                            "Failed to read config file at [[{}]]. {}",
                            steam_config.file, err
                        )));
                    }
                };

                match extract_steam_user_info(
                    &contents,
                    "UserLocalConfigStore",
                    "friends",
                    steam_config.id.as_str(),
                ) {
                    Ok(profile) => profiles.push(profile),
                    Err(err) => {
                        return Err(Error::Custom(format!(
                            "{} while reading config file [[{}]] for Steam account [[{}]]",
                            err, steam_config.file, steam_config.id,
                        )));
                    }
                }
            }

            if profiles.len() < available_configs.len() {
                return Err(Error::Custom(format!(
                    "Failed to find all accounts in your Steam [[userdata]] folder at [[{}]].",
                    config.steam.install.clone().unwrap()
                )));
            }
        }

        Ok(profiles)
    }

    pub fn set_launch_args<F, P>(
        config: &Config,
        params: P,
        generate_launch_args: F,
    ) -> Result<(), Error>
    where
        F: Fn(Option<&str>, P) -> String,
        P: Clone,
    {
        let steam_configs = config.steam.configs.as_ref().unwrap();
        if steam_configs.is_empty() {
            return Err(Error::Custom(
                "Failed to find any accounts in your Steam userdata folder.".into(),
            ));
        }

        let steam_was_closed = close_app();
        let steam_cleanup: Box<dyn FnOnce()> = Box::new(move || {
            if steam_was_closed {
                Command::new("cmd")
                    .args(["/C", "start", "steam://open/games/details/2357570"])
                    .creation_flags(0x0800_0000)
                    .spawn()
                    .ok();
            }
        });

        // Modify each Steam localconfig.vdf file
        for steam_config in steam_configs {
            if !is_overwatch_installed(config, &steam_config.id)? {
                continue;
            }

            let result = set_config_launch_args(
                steam_config.file.as_str(),
                params.clone(),
                &generate_launch_args,
            );

            if result.is_err() {
                steam_cleanup();
                return Err(result.err().unwrap());
            }
        }

        steam_cleanup();
        Ok(())
    }

    /// Updates OverBuddy configuration with the current state of the Battle.net.config file.
    ///
    /// **Warning**: This function modifies the shared configuration fields.
    pub fn update_config(config: &mut Config) -> Result<Option<config::SharedConfig>, Error> {
        // Update config files
        if config.steam.configs.is_none() || config.steam.configs.as_ref().unwrap().is_empty() {
            return Err(Error::Custom(
                "Failed to find any accounts in your Steam userdata folder.".to_string(),
            ));
        }
        // TODO: check for new configs, ensure current config exists

        // Update profiles
        config.steam.profiles = Some(get_profiles(&config)?);

        // Update configuration state
        let mut shared_config = config::SharedConfig {
            background: config::BackgroundConfig {
                current: None,
                is_outdated: false,
            },
            additional: config::AdditionalConfig {
                console_enabled: false,
            },
        };
        let mut background_conflicts = false;

        // Update shared state
        if let Some(available_configs) = &config.steam.configs {
            for steam_config in available_configs {
                if !is_overwatch_installed(config, &steam_config.id)? {
                    continue;
                }

                let launch_args = get_config_launch_args(&steam_config.file)?;

                if let Some(launch_args) = launch_args {
                    // Save current background
                    if !background_conflicts {
                        let current_background = helpers::get_background(&launch_args);

                        let resolved_background =
                            current_background
                                .as_ref()
                                .and_then(|current_background_id| {
                                    backgrounds::find_background_by_id(current_background_id)
                                        .map(|background| background.id.to_string())
                                });

                        if resolved_background.is_some() {
                            if shared_config.background.current.is_some() {
                                if resolved_background.unwrap()
                                    != shared_config.background.current.clone().unwrap()
                                {
                                    shared_config.background.current = None;
                                    shared_config.background.is_outdated = false;

                                    background_conflicts = true;
                                }
                            } else {
                                shared_config.background.current = resolved_background;
                                shared_config.background.is_outdated =
                                    shared_config.background.current.is_none()
                                        && current_background.is_some();
                            }
                        }
                    }

                    // Save debug console state
                    shared_config.additional.console_enabled =
                        helpers::get_console_enabled(&launch_args);
                }
            }
        }

        Ok(Some(shared_config))
    }

    const STEAM_AVATAR_URL: &str = "https://avatars.akamai.steamstatic.com";
    fn extract_steam_user_info(
        contents: &str,
        outer_key: &str,
        middle_key: &str,
        id: &str,
    ) -> Result<SteamProfile, Error> {
        if let Some(outer_start) = contents.find(&format!("\"{}\"", outer_key)) {
            if let Some(middle_start) = contents[outer_start..].find(&format!("\"{}\"", middle_key))
            {
                if let Some(id_start) =
                    contents[outer_start + middle_start..].find(&format!("\"{}\"", id))
                {
                    let object_start = outer_start + middle_start + id_start;
                    if let Some(open_brace_index) = contents[object_start..].find('{') {
                        let object_start = object_start + open_brace_index;
                        let mut open_braces = 1;
                        let mut in_quotes = false;

                        for (i, c) in contents[object_start + 1..].chars().enumerate() {
                            match c {
                                '{' if !in_quotes => open_braces += 1,
                                '}' if !in_quotes => {
                                    open_braces -= 1;
                                    if open_braces == 0 {
                                        let end_index = object_start + i + 2;
                                        let object_str = &contents[object_start..end_index];
                                        let avatar =
                                            extract_value(object_str, "avatar").map(|avatar| {
                                                format!("{}/{}_full.jpg", STEAM_AVATAR_URL, avatar)
                                            });
                                        let mut name = extract_name_history(object_str);
                                        if name.is_none() || name.as_ref().unwrap().is_empty() {
                                            name = extract_value(object_str, "name");
                                        }
                                        if name.is_none() || name.as_ref().unwrap().is_empty() {
                                            return Err(Error::Custom(
                                                "Failed to find profile name".into(),
                                            ));
                                        }

                                        let has_overwatch = get_overwatch_installed(contents)?;

                                        return Ok(SteamProfile {
                                            id: id.to_string(),
                                            name: name.unwrap(),
                                            avatar,
                                            has_overwatch,
                                        });
                                    }
                                }
                                '"' => in_quotes = !in_quotes,
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
        Err(Error::Custom(
            "Reached the end of file without finding target".into(),
        ))
    }

    fn extract_value(object_str: &str, key: &str) -> Option<String> {
        if let Some(start) = object_str.find(&format!("\"{}\"", key)) {
            let key_start = start + key.len() + 3; // Skip the key, quotes, and tab
            if let Some(value_start) = object_str[key_start..].find('"') {
                let value_start = key_start + value_start + 1; // Move past the initial quote
                if let Some(value_end) = object_str[value_start..].find('"') {
                    return Some(object_str[value_start..value_start + value_end].to_string());
                }
            }
        }
        None
    }

    fn extract_name_history(object_str: &str) -> Option<String> {
        if let Some(start) = object_str.find("\"NameHistory\"") {
            let key_start = start + "NameHistory".len() + 3; // Skip the key, quotes, and tab
            if let Some(open_brace_start) = object_str[key_start..].find('{') {
                let nested_start = key_start + open_brace_start + 1; // Move past the opening brace
                if let Some(zero_start) = object_str[nested_start..].find("\"0\"") {
                    let zero_key_start = nested_start + zero_start + 3; // Skip the key, quotes, and tab
                    if let Some(value_start) = object_str[zero_key_start..].find('"') {
                        let value_start = zero_key_start + value_start + 1; // Move past the initial quote
                        if let Some(value_end) = object_str[value_start..].find('"') {
                            return Some(
                                object_str[value_start..value_start + value_end].to_string(),
                            );
                        }
                    }
                }
            }
        }
        None
    }

    fn get_overwatch_installed(contents: &str) -> Result<bool, Error> {
        // Traverse config file to Overwatch entry
        let keys = vec![
            "UserLocalConfigStore",
            "Software",
            "Valve",
            "Steam",
            "apps",
            "2357570",
        ];

        // Use a queue for traversal
        let mut queue: VecDeque<&str> = VecDeque::from(keys);
        let mut current_start = 0;
        let mut current_end = contents.len();

        while let Some(key) = queue.pop_front() {
            if let Some(pos) = contents[current_start..current_end].find(key) {
                if key == "2357570" {
                    break;
                }
                // Update start position
                current_start += pos;
                // Identify opening brace
                let brace_pos = contents[current_start..].find('{').ok_or_else(|| {
                    Error::Custom(
                        "Failed to find an opening brace for the [[2357570]] (Overwatch) key"
                            .to_string(),
                    )
                })?;
                let block_start = current_start + brace_pos + 1;
                // Identify closing brace
                let current_indent = contents[current_start..block_start]
                    .rfind("\n")
                    .and_then(|inner_pos| {
                        contents[current_start + inner_pos + 1..block_start]
                            .chars()
                            .take_while(|&c| c == '\t')
                            .count()
                            .into()
                    })
                    .unwrap_or(0);
                let search_pattern = format!("\n{}{}", "\t".repeat(current_indent), "}");
                // Update end position
                current_end = contents[block_start..]
                    .find(&search_pattern)
                    .map(|i| block_start + i + 1)
                    .ok_or_else(|| {
                        Error::Custom(
                            "Failed to find the closing brace for the [[2357570]] (Overwatch) key"
                                .to_string(),
                        )
                    })?;
            } else {
                if key == "2357570" {
                    return Ok(false);
                }

                return Err(Error::Custom(format!("Failed to find the [[{}]] key", key)));
            }
        }

        Ok(true)
    }

    fn is_overwatch_installed(config: &Config, steam_id: &str) -> Result<bool, Error> {
        if let Some(steam_profiles) = &config.steam.profiles {
            if let Some(profile) = steam_profiles.iter().find(|profile| profile.id == steam_id) {
                return Ok(profile.has_overwatch);
            } else {
                return Err(Error::Custom(format!(
                    "Failed to find a Steam account with id [[{}]].",
                    steam_id
                )));
            }
        }

        Err(Error::Custom(
            "Failed to find any accounts in your Steam [[userdata]] folder.".to_string(),
        ))
    }

    fn verify_file_diff(file1: &str, file2: &str) -> Result<bool, String> {
        let read_lines = |filename: &str| -> io::Result<Vec<String>> {
            let file = File::open(filename)?;
            let reader = BufReader::new(file);
            reader.lines().collect()
        };

        let lines1 = read_lines(file1)
            .map_err(|e| format!("Failed to read [[{}]]: {}", file1, e))?
            .join("\n");
        let lines2 = read_lines(file2)
            .map_err(|e| format!("Failed to read [[{}]]: {}", file2, e))?
            .join("\n");

        let diff = TextDiff::from_lines(&lines1, &lines2);

        let mut delete_count = 0;
        let mut diff_count = 0;
        for change in diff.iter_all_changes() {
            if change.tag() == ChangeTag::Delete {
                if !change.value().contains("LaunchOptions") {
                    return Err(format!(
                        "Tried to incorrectly delete [[{}]]",
                        change.to_string_lossy()
                    ));
                }

                delete_count += 1;
            } else if change.tag() == ChangeTag::Insert {
                if !change.value().contains("LaunchOptions") {
                    return Err(format!(
                        "Tried to incorrectly insert [[{}]]",
                        change.to_string_lossy()
                    ));
                }

                diff_count += 1;
            }

            if diff_count > 1 || delete_count > 1 {
                return Err("More than one line is different".to_string());
            }
        }

        if diff_count == 0 {
            return Ok(false);
        }
        Ok(true)
    }

    fn get_config_launch_args(config_filename: &str) -> Result<Option<String>, Error> {
        let mut file = fs::OpenOptions::new()
            .read(true)
            .write(true)
            .open(config_filename)
            .map_err(|_| {
                Error::Custom(format!(
                    "Failed to open the Steam config file at [[{}]]",
                    config_filename
                ))
            })?;
        let mut local_config = String::new();
        file.read_to_string(&mut local_config).map_err(|_| {
            Error::Custom(format!(
                "Failed to read Steam config file at [[{}]]",
                config_filename
            ))
        })?;

        // Traverse config file to Overwatch entry
        let keys = vec![
            "UserLocalConfigStore",
            "Software",
            "Valve",
            "Steam",
            "apps",
            "2357570",
        ];

        let mut queue: VecDeque<&str> = VecDeque::from(keys);
        let mut current_start = 0;
        let mut current_end = local_config.len();

        while let Some(key) = queue.pop_front() {
            if let Some(pos) = local_config[current_start..current_end].find(key) {
                // Update start position
                current_start += pos;
                // Identify opening brace
                let brace_pos = local_config[current_start..].find('{').ok_or_else(|| {
                    Error::Custom(format!(
                        "Failed to find an opening brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                        config_filename
                    ))
                })?;
                let block_start = current_start + brace_pos + 1;
                // Identify closing brace
                let current_indent = local_config[current_start..block_start]
                    .rfind("\n")
                    .and_then(|inner_pos| {
                        local_config[current_start + inner_pos + 1..block_start]
                            .chars()
                            .take_while(|&c| c == '\t')
                            .count()
                            .into()
                    })
                    .unwrap_or(0);
                let search_pattern = format!("\n{}{}", "\t".repeat(current_indent), "}");
                // Update end position
                current_end = local_config[block_start..]
                    .find(&search_pattern)
                    .map(|i| block_start + i + 1)
                    .ok_or_else(|| {
                        Error::Custom(format!(
                            "Failed to find the closing brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].", config_filename
                        ))
                    })?;
            } else {
                if key == "2357570" {
                    // Overwatch not installed on this account
                    return Ok(None);
                }
                return Err(Error::Custom(format!(
                    "Failed to find the [[{}]] key in Steam config at [[{}]].",
                    key, config_filename
                )));
            }
        }

        // Get Overwatch config block
        let brace_pos = local_config[current_start..].find('{').ok_or_else(|| {
                Error::Custom(format!(
                    "Failed to find an opening brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                    config_filename
                ))
            })?;
        let block_start = current_start + brace_pos + 1;
        let block_end = current_end;

        // Set LaunchOptions config to background
        if let Some(launch_options_pos) =
            local_config[block_start..block_end].find("\"LaunchOptions\"")
        {
            let value_start = block_start + launch_options_pos + "\"LaunchOptions\"".len() + 3; // Skip the key, quotes, and tab
            let value_end = value_start
                + local_config[value_start..block_end]
                    .find('"')
                    .unwrap_or(value_start);

            if value_start > value_end {
                return Err(Error::Custom(format!(
                        "Failed to read the [[LaunchOptions]] key, inside the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                        config_filename
                    )));
            }

            let launch_args = &local_config[value_start..value_end];
            return Ok(Some(launch_args.to_string()));
        } else {
            return Ok(Some(String::new()));
        }
    }

    fn set_config_launch_args<F, P>(
        config_filename: &str,
        params: P,
        generate_launch_args: &F,
    ) -> Result<(), Error>
    where
        F: Fn(Option<&str>, P) -> String,
    {
        let backup_path = format!("{}.backup", config_filename);

        // Create scope to release config file lock
        {
            let mut file = fs::OpenOptions::new()
                .read(true)
                .write(true)
                .open(config_filename)
                .map_err(|_| {
                    Error::Custom(format!(
                        "Failed to open the Steam config file at [[{}]]",
                        config_filename
                    ))
                })?;
            let mut local_config = String::new();
            file.read_to_string(&mut local_config).map_err(|_| {
                Error::Custom(format!(
                    "Failed to read Steam config file at [[{}]]",
                    config_filename
                ))
            })?;

            // Traverse config file to Overwatch entry
            let keys = vec![
                "UserLocalConfigStore",
                "Software",
                "Valve",
                "Steam",
                "apps",
                "2357570",
            ];

            let mut queue: VecDeque<&str> = VecDeque::from(keys);
            let mut current_start = 0;
            let mut current_end = local_config.len();

            while let Some(key) = queue.pop_front() {
                if let Some(pos) = local_config[current_start..current_end].find(key) {
                    // Update start position
                    current_start += pos;
                    // Identify opening brace
                    let brace_pos = local_config[current_start..].find('{').ok_or_else(|| {
                    Error::Custom(format!(
                        "Failed to find an opening brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                        config_filename
                    ))
                })?;
                    let block_start = current_start + brace_pos + 1;
                    // Identify closing brace
                    let current_indent = local_config[current_start..block_start]
                        .rfind("\n")
                        .and_then(|inner_pos| {
                            local_config[current_start + inner_pos + 1..block_start]
                                .chars()
                                .take_while(|&c| c == '\t')
                                .count()
                                .into()
                        })
                        .unwrap_or(0);
                    let search_pattern = format!("\n{}{}", "\t".repeat(current_indent), "}");
                    // Update end position
                    current_end = local_config[block_start..]
                    .find(&search_pattern)
                    .map(|i| block_start + i + 1)
                    .ok_or_else(|| {
                        Error::Custom(format!(
                            "Failed to find the closing brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].", config_filename
                        ))
                    })?;
                } else {
                    if key == "2357570" {
                        // Overwatch not installed on this account
                        return Ok(());
                    }
                    return Err(Error::Custom(format!(
                        "Failed to find the [[{}]] key in Steam config at [[{}]].",
                        key, config_filename
                    )));
                }
            }

            // Get Overwatch config block
            let brace_pos = local_config[current_start..].find('{').ok_or_else(|| {
                Error::Custom(format!(
                    "Failed to find an opening brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                    config_filename
                ))
            })?;
            let block_start = current_start + brace_pos + 1;
            let block_end = current_end;

            // Set LaunchOptions config to background
            if let Some(launch_options_pos) =
                local_config[block_start..block_end].find("\"LaunchOptions\"")
            {
                let value_start = block_start + launch_options_pos + "\"LaunchOptions\"".len() + 3; // Skip the key, quotes, and tab
                let value_end = value_start
                    + local_config[value_start..block_end]
                        .find('"')
                        .unwrap_or(value_start);

                if value_start > value_end {
                    return Err(Error::Custom(format!(
                        "Failed to read the [[LaunchOptions]] key, inside the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                        config_filename
                    )));
                }

                let launch_args = &local_config[value_start..value_end];
                let new_launch_args = generate_launch_args(Some(launch_args), params);
                local_config.replace_range(value_start..value_end, &new_launch_args);
            } else {
                let new_launch_args = generate_launch_args(None, params);

                local_config.insert_str(
                    block_start + 1,
                    format!("\t\t\t\t\t\t\"LaunchOptions\"\t\t\"{}\"\n", new_launch_args).as_str(),
                );
            }

            // Backup config file
            match fs::File::create(&backup_path) {
                Ok(_) => {}
                Err(_) => {
                    return Err(Error::Custom(format!(
                        "Failed to create backup of [[{}]]",
                        config_filename
                    )));
                }
            }
            let mut file = match fs::OpenOptions::new()
                .write(true)
                .truncate(true)
                .open(&backup_path)
            {
                Ok(file) => file,
                Err(_) => {
                    return Err(Error::Custom(format!(
                        "Failed to open created backup file at [[{}]]",
                        backup_path
                    )));
                }
            };
            match file.write_all(local_config.as_bytes()) {
                Ok(_) => {}
                Err(_) => {
                    return Err(Error::Custom(format!(
                        "Failed to write to the backup file at [[{}]]",
                        backup_path
                    )));
                }
            }

            // Verify backup file
            let config_changed = verify_file_diff(&config_filename, &backup_path);
            if config_changed.is_err() {
                return Err(Error::Custom(format!(
                    "Failed to verify the backup file at [[{}]], {}.",
                    backup_path,
                    config_changed.unwrap_err()
                )));
            }

            // Apply backup file
            if !config_changed.unwrap() {
                return Ok(());
            }
        }

        // Apply backup file
        if let Err(e) = fs::rename(backup_path, config_filename) {
            return Err(Error::Custom(format!(
                "Failed to replace [[{}]] with backup file. {}",
                config_filename, e
            )));
        }
        return Ok(());
    }
}
