use crate::config::{get_default_config, Config, SteamProfile, CONFIG_FILE};

use serde::Serialize;
use serde_json::{from_reader, Serializer, Value};
use similar::{ChangeTag, TextDiff};
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use sysinfo::System;
use tauri::AppHandle;

// Global helpers

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),

    #[error("{0}")]
    Custom(String),
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub fn display_path_string(path: &PathBuf) -> Result<String, Error> {
    dunce::canonicalize(&path)
        .map(|canonicalized| canonicalized.display().to_string())
        .map_err(|err| Error::Custom(format!("Error processing path: {:?}", err)))
}

fn merge(a: &mut Value, b: Value) {
    if let Value::Object(a) = a {
        if let Value::Object(b) = b {
            for (k, v) in b {
                if v.is_null() {
                    a.remove(&k);
                } else {
                    merge(a.entry(k).or_insert(Value::Null), v);
                }
            }

            return;
        }
    }

    *a = b;
}

pub fn read_config(handle: &AppHandle) -> Result<Config, Error> {
    let app_local_data_dir = handle.path_resolver().app_local_data_dir().unwrap();

    // Ensure directory exists
    if !app_local_data_dir.exists() {
        match fs::create_dir_all(&app_local_data_dir) {
            Ok(_) => {}
            Err(_) => {
                return Err(Error::Custom(format!(
                    "Failed to read local data in [[{}]]",
                    app_local_data_dir.to_str().unwrap()
                )));
            }
        }
    }

    // Ensure file exists
    let config_file_path = app_local_data_dir.join(CONFIG_FILE);
    if !config_file_path.exists() {
        match fs::File::create(&config_file_path) {
            Ok(_) => {}
            Err(_) => {
                return Err(Error::Custom(format!(
                    "Failed to create configuration file [[{}]]",
                    config_file_path.to_str().unwrap()
                )));
            }
        }
    }

    // Get config
    let config = match fs::read_to_string(&config_file_path) {
        Ok(contents) => contents,
        Err(_) => String::new(),
    };
    let config: Config = match serde_json::from_str::<Value>(&config) {
        Ok(json) => {
            let result: Result<Config, _> = serde_json::from_value(json.clone());
            match result {
                Ok(config) => config,
                Err(_) => {
                    let mut config: Value = serde_json::to_value(get_default_config()).unwrap();
                    merge(&mut config, json);
                    serde_json::from_value(config).map_err(|_| {
                        Error::Custom(format!(
                            "Failed to parse configuration file [[{}]]",
                            config_file_path.to_str().unwrap()
                        ))
                    })?
                }
            }
        }
        Err(_) => get_default_config(),
    };

    return Ok(config);
}

pub fn write_config(handle: &AppHandle, config: &Config) -> Result<(), Error> {
    let app_local_data_dir = handle.path_resolver().app_local_data_dir().unwrap();

    // Ensure directory exists
    if !app_local_data_dir.exists() {
        match fs::create_dir_all(&app_local_data_dir) {
            Ok(_) => {}
            Err(_) => {
                return Err(Error::Custom(format!(
                    "Failed to write local data in [[{}]]",
                    app_local_data_dir.to_str().unwrap()
                )));
            }
        }
    }

    // Ensure file exists
    let config_file_path = app_local_data_dir.join(CONFIG_FILE);
    if !config_file_path.exists() {
        match fs::File::create(&config_file_path) {
            Ok(_) => {}
            Err(_) => {
                return Err(Error::Custom(format!(
                    "Failed to create configuration file in [[{}]]",
                    config_file_path.to_str().unwrap()
                )));
            }
        }
    }

    // Write config
    let serialized_config = match serde_json::to_string(&config) {
        Ok(json) => json,
        Err(_) => {
            return Err(Error::Custom(format!("Failed to serialize config.")));
        }
    };
    match fs::write(&config_file_path, &serialized_config) {
        Ok(_) => {}
        Err(_) => {
            return Err(Error::Custom(format!(
                "Failed to write configuration file in [[{}]]",
                config_file_path.to_str().unwrap()
            )));
        }
    }

    return Ok(());
}

pub fn get_file_name_from_path(path: &str) -> Option<&str> {
    Path::new(path).file_name().and_then(|name| name.to_str())
}

// Background helpers

// Update launch arguments
pub fn get_launch_args(launch_args: Option<&str>, id: Option<&str>) -> String {
    let new_arg: Option<String>;
    if id.is_some() {
        new_arg = Some(format!("--lobbyMap={}", id.unwrap()));
    } else {
        new_arg = None;
    }

    if launch_args.is_some() {
        let filtered_args = launch_args
            .unwrap()
            .split_whitespace()
            .filter(|&part| !part.starts_with("--lobbyMap"))
            .collect::<Vec<&str>>()
            .join(" ");

        if !filtered_args.is_empty() {
            if new_arg.is_some() {
                return format!("{} {}", filtered_args, new_arg.unwrap());
            } else {
                return filtered_args;
            }
        }
    }

    if new_arg.is_some() {
        return new_arg.unwrap();
    } else {
        return String::new();
    }
}

// Battle.net helpers

pub fn close_battle_net() -> bool {
    let mut flag = false;
    let system = System::new_all();
    for process in system.processes_by_name("Battle.net.exe") {
        if process.kill() {
            flag = true;
        }
    }

    return flag;
}

// pub fn is_battle_net_running() -> Result<bool, Error> {
//     let system = System::new_all();
//     for _ in system.processes_by_name("Battle.net.exe") {
//         return Ok(true);
//     }
//     Ok(false)
// }

pub fn safe_json_write(path: String, json: &serde_json::Value) -> Result<(), Error> {
    // Create backup
    let backup_path = format!("{}.backup", path);
    if Path::new(&path).exists() {
        fs::copy(&path, &backup_path).map_err(|e| {
            Error::Custom(format!(
                "Failed to create backup of [[{}]]: {}",
                get_file_name_from_path(&path).unwrap_or("unknown"),
                e
            ))
        })?;
    }

    let cleanup = |replace: bool| -> Result<(), Error> {
        if Path::new(&backup_path).exists() {
            if replace {
                fs::copy(&backup_path, &path).map_err(|_| {
                    Error::Custom(format!(
                        "Failed to restore backup of [[{}]]",
                        get_file_name_from_path(&path).unwrap_or("unknown")
                    ))
                })?;
            }
            let _ = fs::remove_file(&backup_path);
        }
        Ok(())
    };

    // Write to file
    let mut file = match fs::OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(&path)
    {
        Ok(file) => file,
        Err(_) => {
            cleanup(false)?;
            return Err(Error::Custom(format!(
                "Failed to open [[{}]] file at [[{}]]",
                get_file_name_from_path(&path).unwrap_or("unknown"),
                path
            )));
        }
    };
    let pretty_formatter = serde_json::ser::PrettyFormatter::with_indent(b"    ");
    let mut serializer = Serializer::with_formatter(&mut file, pretty_formatter);
    match json.serialize(&mut serializer) {
        Ok(_) => (),
        Err(_) => {
            cleanup(false)?;
            return Err(Error::Custom(format!("Failed to write to [[{}]]", path)));
        }
    }

    // Validate new config
    let file = match File::open(&path) {
        Ok(file) => file,
        Err(_) => {
            // Restore backup
            cleanup(true)?;
            return Err(Error::Custom(format!(
                "Failed to open [[{}]] file at [[{}]]",
                get_file_name_from_path(&path).unwrap_or("unknown"),
                path
            )));
        }
    };

    let parsed_json: Result<Value, _> = from_reader(file);
    match parsed_json {
        Ok(_) => {
            // JSON is good, remove the backup
            cleanup(false)?;
            Ok(())
        }
        Err(_) => {
            // JSON is corrupted, restore the backup
            cleanup(true)?;
            Err(Error::Io(std::io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Failed to write to [[{}]]", path),
            )))
        }
    }
}

// Steam helpers

pub fn close_steam() -> bool {
    let mut flag = false;
    let system = System::new_all();
    for process in system.processes_by_name("steam.exe") {
        if process.kill() {
            flag = true;
        }
    }

    return flag;
}

pub fn get_steam_profiles(config: &Config) -> Result<Vec<SteamProfile>, Error> {
    let mut profiles: Vec<SteamProfile> = vec![];

    if let Some(available_configs) = &config.steam.configs {
        for steam_config in available_configs {
            let config_path = Path::new(&steam_config.file);
            if config_path.exists() {
                match fs::read_to_string(config_path) {
                    Ok(contents) => {
                        match extract_steam_user_info(
                            &contents,
                            "UserLocalConfigStore",
                            "friends",
                            steam_config.id.as_str(),
                        ) {
                            Ok(profile) => profiles.push(profile),
                            Err(err) => {
                                return Err(Error::Custom(format!(
                                    "{} while reading user info of Steam account [[{}]] from the config file at [[{}]]",
                                    err, steam_config.id, steam_config.file
                                )));
                            }
                        }
                    }
                    Err(err) => {
                        return Err(Error::Custom(format!(
                            "Failed to read config file at [[{}]]. {}",
                            steam_config.file, err
                        )));
                    }
                }
            }
        }
    }

    Ok(profiles)
}

const STEAM_AVATAR_URL: &str = "https://avatars.akamai.steamstatic.com";

fn extract_steam_user_info(
    contents: &str,
    outer_key: &str,
    middle_key: &str,
    id: &str,
) -> Result<SteamProfile, Error> {
    if let Some(outer_start) = contents.find(&format!("\"{}\"", outer_key)) {
        if let Some(middle_start) = contents[outer_start..].find(&format!("\"{}\"", middle_key)) {
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
                                        return Err(Error::Custom(format!(
                                            "Failed to find profile name"
                                        )));
                                    }

                                    let has_overwatch = is_steam_overwatch_installed(contents);

                                    return Ok(SteamProfile {
                                        avatar,
                                        name,
                                        id: Some(id.to_string()),
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
    Err(Error::Custom(format!(
        "Reached the end of file without finding target"
    )))
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
                        return Some(object_str[value_start..value_start + value_end].to_string());
                    }
                }
            }
        }
    }
    None
}

fn is_steam_overwatch_installed(contents: &str) -> bool {
    // limit to the first 100 lines
    println!("{}", &contents[..100]);
    // let user_start = local_config
    //     .find("\"UserLocalConfigStore\"")

    return true;
}

fn diff_files(file1: &str, file2: &str) -> Result<bool, String> {
    let read_lines = |filename: &str| -> io::Result<Vec<String>> {
        let file = File::open(filename)?;
        let reader = BufReader::new(file);
        reader.lines().collect()
    };

    let lines1 = read_lines(file1)
        .map_err(|e| format!("Failed to read {}: {}", file1, e))?
        .join("\n");
    let lines2 = read_lines(file2)
        .map_err(|e| format!("Failed to read {}: {}", file2, e))?
        .join("\n");

    let diff = TextDiff::from_lines(&lines1, &lines2);

    let mut delete_count = 0;
    let mut diff_count = 0;
    for change in diff.iter_all_changes() {
        if change.tag() == ChangeTag::Delete {
            delete_count += 1;
        } else if change.tag() == ChangeTag::Insert {
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

pub fn set_steam_launch_options(config_filename: &str, id: Option<&str>) -> Result<(), Error> {
    let mut file = match fs::OpenOptions::new().read(true).open(config_filename) {
        Ok(file) => file,
        Err(_) => {
            return Err(Error::Custom(format!(
                "Failed to open the Steam config file at [[{}]]",
                config_filename
            )));
        }
    };
    let mut local_config = String::new();
    match file.read_to_string(&mut local_config) {
        Ok(_) => {}
        Err(_) => {
            return Err(Error::Custom(format!(
                "Failed to read Steam config file at [[{}]]",
                config_filename
            )));
        }
    }

    let user_start = local_config
        .find("\"UserLocalConfigStore\"")
        .ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find the [[UserLocalConfigStore]] key in Steam config at [[{}]].",
                config_filename
            ))
        })?;
    let software_pos = local_config[user_start..]
        .find("\"Software\"")
        .ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find the [[Software]] key in Steam config at [[{}]].",
                config_filename
            ))
        })?;
    let software_start = user_start + software_pos;

    let valve_pos = local_config[software_start..]
        .find("\"Valve\"")
        .ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find the [[Valve]] key in Steam config at [[{}]].",
                config_filename
            ))
        })?;
    let valve_start = valve_pos + software_start;

    let steam_pos = local_config[valve_start..]
        .find("\"Steam\"")
        .ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find the [[[Steam]] key in Steam config at [[{}]].",
                config_filename
            ))
        })?;
    let steam_start = valve_start + steam_pos;

    let apps_pos = local_config[steam_start..]
        .find("\"apps\"")
        .ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find the [[apps]] key in Steam config at [[{}]].",
                config_filename
            ))
        })?;
    let apps_start = steam_start + apps_pos;
    let ow_id_pos = local_config[apps_start..]
        .find("\"2357570\"")
        .ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                config_filename
            ))
        })?;

    let ow_id_start = ow_id_pos + apps_start;
    let brace_pos = local_config[ow_id_start..].find('{').ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find an opening brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                config_filename
            ))
        })?;

    let ow_block_start = ow_id_start + brace_pos + 1;
    let ow_block_end = ow_block_start + local_config[ow_block_start..].find('}').ok_or_else(|| {
            Error::Custom(format!(
                "Failed to find a closing brace for the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                config_filename
            ))
        })?;

    let launch_options_pos = local_config[ow_block_start..ow_block_end].find("\"LaunchOptions\"");

    if launch_options_pos.is_none() {
        let new_launch_args = get_launch_args(None, id);

        local_config.insert_str(
            ow_block_start + 1,
            format!("\t\t\t\t\t\t\"LaunchOptions\"\t\t\"{}\"\n", new_launch_args).as_str(),
        );
    } else {
        let value_start =
            ow_block_start + launch_options_pos.unwrap() + "\"LaunchOptions\"".len() + 3;
        let value_end = value_start
            + local_config[value_start..ow_block_end]
                .find('"')
                .unwrap_or(value_start);
        if value_start >= value_end {
            return Err(Error::Custom(format!(
                    "Failed to read the [[LaunchOptions]] key, inside the [[2357570]] (Overwatch) key in Steam config at [[{}]].",
                    config_filename
                )));
        }
        let launch_args = &local_config[value_start..value_end];
        let new_launch_args = get_launch_args(Some(launch_args), id);
        local_config.replace_range(value_start..value_end, &new_launch_args);
    }

    let backup_path = format!("{}.backup", config_filename);
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

    // verify backup file
    let config_changed = diff_files(&config_filename, &backup_path);
    if config_changed.is_err() {
        return Err(Error::Custom(format!(
            "Failed to verify the backup file at [[{}]], {}.",
            backup_path,
            config_changed.unwrap_err()
        )));
    }

    // replace config file
    println!("{}", config_changed.clone().unwrap());
    if !config_changed.unwrap() {
        return Ok(());
    }

    println!("replace");
    // if fs::metadata(config_filename).is_ok() {
    //     fs::remove_file(config_filename)?;
    // }
    fs::rename(backup_path, format!("{}a", config_filename))?;
    return Ok(());
}
