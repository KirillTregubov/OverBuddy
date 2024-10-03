// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backgrounds;
mod config;
mod helpers;

use helpers::Error;
use serde::Serialize;
use serde_json::{from_reader, json};
use std::env;
use std::fs::{self, File};
use std::io::Read;
use std::os::windows::process::CommandExt; // NOTE: Windows only
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Window;

#[tauri::command]
fn mounted(window: Window) {
    let window = window.get_webview_window("main").unwrap();
    if window.is_visible().unwrap() {
        return;
    }
    thread::sleep(Duration::from_millis(500));
    window.show().unwrap();
    window.set_focus().unwrap();
}

#[tauri::command]
fn get_launch_config(handle: AppHandle) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;
    // println!("Launched with {:?}", config);

    if config.is_setup {
        if config.battle_net.enabled {
            let battle_net_config = config.battle_net.config.clone().unwrap();

            // Restore backup configuration if it exists
            let backup_path = format!("{}.backup", battle_net_config);
            if Path::new(&backup_path).exists() {
                fs::copy(&backup_path, &battle_net_config).map_err(|_| {
                    Error::Custom(format!(
                        "Failed to restore backup of [[{}]]",
                        helpers::get_file_name_from_path(&battle_net_config).unwrap_or("unknown")
                    ))
                })?;
                let _ = fs::remove_file(&backup_path);
            }

            let file = match File::open(&battle_net_config) {
                Ok(file) => file,
                Err(_) => {
                    return Err(Error::Custom(format!(
                        "Failed to open the [[{}]] file at [[{}]]. If you have changed your Battle.net installation, please reset settings.",
                        helpers::get_file_name_from_path(&battle_net_config).unwrap_or("unknown"),
                        battle_net_config
                    )));
                }
            };
            let json: serde_json::Value = match from_reader(file) {
                Ok(json) => json,
                Err(_) => {
                    return Err(Error::Custom(format!(
                        "Failed to read [[{}]] file at [[{}]]",
                        helpers::get_file_name_from_path(&battle_net_config).unwrap_or("unknown"),
                        battle_net_config
                    )));
                }
            };

            if json
                .get("Games")
                .and_then(|games| games.get("prometheus"))
                .is_none()
            {
                config.battle_net.enabled = false;
                config.battle_net.install = None;
                config.battle_net.config = None;
            } else {
                if let Some(launch_args) =
                    json["Games"]["prometheus"]["AdditionalLaunchArguments"].as_str()
                {
                    let current_background = launch_args
                        .split_whitespace()
                        .find(|s| s.starts_with("--lobbyMap="))
                        .and_then(|s| s.split('=').nth(1))
                        .map(|s| {
                            if s.is_empty() {
                                None
                            } else {
                                Some(String::from(s))
                            }
                        })
                        .flatten();

                    config.background.current =
                        current_background
                            .as_ref()
                            .and_then(|current_background_id| {
                                backgrounds::find_background_by_id(current_background_id)
                                    .map(|background| background.id.to_string())
                            });

                    if config.background.current.is_none() && current_background.is_some() {
                        config.background.is_outdated = true;
                    } else {
                        config.background.is_outdated = false;
                    }
                }
            }
        }

        if config.steam.enabled {
            // TODO: check for new configs, ensure current config exists, restore from backup?
            return Err(Error::Custom(format!("Steam is not supported yet.")));
        }
    }

    if config.battle_net.enabled == false && config.steam.enabled == false {
        config.is_setup = false;
    }

    helpers::write_config(&handle, &config)?;
    return Ok(serde_json::to_string(&config)?);
}

#[derive(Serialize)]
enum ErrorKey {
    NoOverwatch,
    BattleNetInstall,
    BattleNetConfig,
    SteamInstall,
    SteamAccount,
}
#[derive(Serialize)]
struct SetupError {
    error_key: ErrorKey,
    message: String,
    platforms: Option<Vec<String>>,
}

#[tauri::command]
fn setup(handle: AppHandle, platforms: Vec<&str>, is_initialized: bool) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    if platforms.contains(&"BattleNet") {
        // Check if Battle.net is installed
        if config.battle_net.install.is_none() {
            static LAUNCHER_PATH: &str = "Battle.net\\Battle.net Launcher.exe";
            if let Some(program_files_dir) = env::var_os("programfiles(x86)") {
                let battle_net_install =
                    Path::new(program_files_dir.to_str().unwrap()).join(LAUNCHER_PATH);
                if battle_net_install.exists() {
                    config.battle_net.install =
                        Some(battle_net_install.to_string_lossy().to_string());
                }
            }
        }

        if config.battle_net.install.is_none() {
            return Err(Error::Custom(serde_json::to_string(&SetupError {
                error_key: ErrorKey::BattleNetInstall,
                message: "Failed to find your Battle.net installation.".to_string(),
                platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
            })?));
        }

        // Check if Battle.net config exists
        static CONFIG_FILE: &str = "Battle.net.config";
        let battle_net_config = match &config.battle_net.config {
            Some(battle_net_config) => battle_net_config.clone(),
            None => {
                let app_data_dir = handle.path().app_data_dir().unwrap();
                let resource_path = app_data_dir.join("../Battle.net");

                // Check if Battle.net AppData directory exists
                if let Ok(entries) = fs::read_dir(&resource_path) {
                    // Check if Battle.net.config exists in the directory
                    if let Some(target_entry) = entries
                        .filter_map(|entry| entry.ok())
                        .find(|entry| entry.file_name().to_string_lossy() == CONFIG_FILE)
                    {
                        let display_path = helpers::display_path_string(&target_entry.path())?;
                        config.battle_net.config = Some(display_path.clone());
                        display_path
                    } else {
                        let display_path = helpers::display_path_string(&resource_path)?;
                        return Err(Error::Custom(serde_json::to_string(&SetupError {
                            error_key: ErrorKey::BattleNetConfig,
                            message: format!(
                                "Failed to find [[{}]] in [[{}]].",
                                CONFIG_FILE, display_path
                            ),
                            platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                        })?));
                    }
                } else {
                    return Err(Error::Custom(serde_json::to_string(&SetupError {
                        error_key: ErrorKey::BattleNetConfig,
                        message: "Failed to find the Battle.net AppData directory.".to_string(),
                        platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                    })?));
                }
            }
        };

        // Open Battle.net.config file
        let mut file = match fs::OpenOptions::new()
            .read(true)
            .open(battle_net_config.clone())
        {
            Ok(file) => file,
            Err(_) => {
                return Err(Error::Custom(serde_json::to_string(&SetupError {
                    error_key: ErrorKey::BattleNetConfig,
                    message: format!(
                        "Failed to open the [[{}]] file at [[{}]]",
                        CONFIG_FILE, battle_net_config
                    ),
                    platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                })?));
            }
        };
        let mut contents = String::new();
        match file.read_to_string(&mut contents) {
            Ok(_) => {}
            Err(_) => {
                return Err(Error::Custom(serde_json::to_string(&SetupError {
                    error_key: ErrorKey::BattleNetConfig,
                    message: format!(
                        "Failed to read [[{}]] file in [[{}]]",
                        CONFIG_FILE, battle_net_config
                    ),
                    platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                })?));
            }
        };
        let mut json: serde_json::Value = serde_json::from_str(&contents)?;

        // Check Overwatch installation on Battle.net
        if json
            .get("Games")
            .and_then(|games| games.get("prometheus"))
            .is_none()
        {
            return Err(Error::Custom(serde_json::to_string(&SetupError {
                error_key: ErrorKey::NoOverwatch,
                message: "Unable to find an Overwatch installation on Battle.net.".to_string(),
                platforms: None,
            })?));
        }

        // Check and create AdditionalLaunchArguments if it doesn't exist
        let mut battle_net_was_closed = false;
        if let Some(game_config) = json
            .get_mut("Games")
            .and_then(|games| games.get_mut("prometheus"))
        {
            if game_config.get("AdditionalLaunchArguments").is_none() {
                game_config
                    .as_object_mut()
                    .unwrap()
                    .insert("AdditionalLaunchArguments".to_string(), json!(""));

                battle_net_was_closed = helpers::close_battle_net();
            } else {
                let launch_args = game_config
                    .get("AdditionalLaunchArguments")
                    .and_then(|launch_args| launch_args.as_str());
                match launch_args {
                    Some(arguments) => {
                        let current_background = arguments
                            .split_whitespace()
                            .find(|s| s.starts_with("--lobbyMap="))
                            .and_then(|s| s.split('=').nth(1))
                            .map(|s| {
                                if s.is_empty() {
                                    None
                                } else {
                                    Some(String::from(s))
                                }
                            })
                            .flatten();

                        if let Some(ref current_background) = current_background {
                            config.background.current = Some(current_background.clone());

                            if let None = backgrounds::find_background_by_id(current_background) {
                                config.background.is_outdated = true;
                            }
                        }
                    }
                    None => (),
                };
            }
        }

        // Check and create DefaultStartupScreen if it doesn't exist
        if let Some(client_config) = json.get_mut("Client") {
            if client_config.get("DefaultStartupScreen").is_none() {
                client_config
                    .as_object_mut()
                    .unwrap()
                    .insert("DefaultStartupScreen".to_string(), json!("1"));

                battle_net_was_closed = helpers::close_battle_net();
            } else {
                let startup_screen = client_config["DefaultStartupScreen"]
                    .as_str()
                    .map(|s| s.to_string());

                if startup_screen.is_none() || startup_screen.unwrap() == "0" {
                    client_config
                        .as_object_mut()
                        .unwrap()
                        .insert("DefaultStartupScreen".to_string(), json!("1"));

                    battle_net_was_closed = helpers::close_battle_net();
                }
            }
        }

        // Cleanup: Reopen Battle.net if it was closed
        if battle_net_was_closed {
            helpers::safe_json_write(battle_net_config, &json)?;
            Command::new(config.battle_net.install.clone().unwrap())
                .spawn()
                .or_else(|_| {
                    Err(Error::Custom(format!(
                        "Failed to open Battle.net at [[{}]].",
                        config.battle_net.install.clone().unwrap()
                    )))
                })?;
        }

        // Enable Battle.net
        config.battle_net.enabled = true;
    } else {
        if config.battle_net.enabled && config.background.current.is_some() {
            let battle_net_config = config.battle_net.config.clone().unwrap();

            // Read the Battle net config
            let mut file = match fs::OpenOptions::new()
                .read(true)
                .open(battle_net_config.clone())
            {
                Ok(file) => file,
                Err(_) => {
                    return Err(Error::Custom(serde_json::to_string(&SetupError {
                        error_key: ErrorKey::BattleNetConfig,
                        message: format!(
                            "Failed to open the [[Battle.net.config]] file at [[{}]]",
                            battle_net_config
                        ),
                        platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                    })?));
                }
            };
            let mut contents = String::new();
            match file.read_to_string(&mut contents) {
                Ok(_) => {}
                Err(_) => {
                    return Err(Error::Custom(serde_json::to_string(&SetupError {
                        error_key: ErrorKey::BattleNetConfig,
                        message: format!(
                            "Failed to read [[Battle.net.config]] file in [[{}]]",
                            battle_net_config
                        ),
                        platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                    })?));
                }
            };
            let mut json: serde_json::Value = serde_json::from_str(&contents)?;

            // Revert to default background if it was changed
            if config.background.current.is_some() {
                if let Some(launch_args) = json
                    .get("Games")
                    .and_then(|games| games.get("prometheus"))
                    .and_then(|prometheus| prometheus.get("AdditionalLaunchArguments"))
                    .and_then(|args| args.as_str())
                {
                    let battle_net_was_closed = helpers::close_battle_net();

                    let filtered_args = helpers::get_launch_args(Some(launch_args), None);
                    json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(filtered_args);
                    helpers::safe_json_write(battle_net_config, &json)?;

                    if battle_net_was_closed {
                        Command::new(config.battle_net.install.clone().unwrap())
                            .spawn()
                            .ok();
                    }
                }
            }
        }

        config.battle_net.enabled = false;
    }

    if platforms.contains(&"Steam") {
        return Err(Error::Custom(format!("Steam is not supported yet.")));

        // Check if Steam is installed
        if config.steam.install.is_none() {
            static LAUNCHER_PATH: &str = "Steam\\steam.exe";
            if let Some(program_files_dir) = env::var_os("programfiles(x86)") {
                let steam_install =
                    Path::new(program_files_dir.to_str().unwrap()).join(LAUNCHER_PATH);
                if steam_install.exists() {
                    config.steam.install = Some(steam_install.to_string_lossy().to_string());
                }
            }
        }
        if config.steam.install.is_none() {
            return Err(Error::Custom(serde_json::to_string(&SetupError {
                error_key: ErrorKey::SteamInstall,
                message: "Failed to find your Steam installation.".to_string(),
                platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
            })?));
        }
        let steam_install = config.steam.install.clone().unwrap();

        // Check if Steam localconfig exists
        static CONFIG_FILE: &str = "localconfig.vdf";
        let steam_path = Path::new(&steam_install).parent().ok_or_else(|| {
            Error::Custom(
                serde_json::to_string(&SetupError {
                    error_key: ErrorKey::SteamInstall,
                    message: "Failed to read the parent directory of your Steam installation."
                        .to_string(),
                    platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                })
                .unwrap(),
            )
        })?;

        // Fetch Steam userdata
        let userdata_path = steam_path.join("userdata");
        if userdata_path.exists() && userdata_path.is_dir() {
            match fs::read_dir(&userdata_path) {
                Ok(entries) => {
                    for entry in entries.filter_map(Result::ok) {
                        let config_path = entry.path().join("config");
                        let config_file_path = config_path.join(CONFIG_FILE);
                        if config_file_path.exists() && config_file_path.is_file() {
                            let new_config = config::SteamLocalconfig {
                                id: entry.file_name().to_string_lossy().to_string(),
                                file: config_file_path.to_string_lossy().to_string(),
                            };

                            if config.steam.configs.is_none() {
                                config.steam.configs = Some(vec![new_config]);
                            } else {
                                let available_configs = config.steam.configs.as_mut().unwrap();
                                if !available_configs
                                    .iter()
                                    .any(|config| config.id == new_config.id)
                                {
                                    available_configs.push(new_config);
                                }
                            }
                        }
                    }
                }
                Err(_) => {}
            }
        } else {
            return Err(Error::Custom(serde_json::to_string(&SetupError {
                error_key: ErrorKey::SteamInstall,
                message: format!(
                    "Failed to read Steam [[userdata]] folder, located at [[{}]].",
                    userdata_path.to_string_lossy().to_string()
                ),
                platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
            })?));
        }

        // Check if Steam accounts exist
        if config.steam.configs.is_none() || config.steam.configs.as_ref().unwrap().is_empty() {
            return Err(Error::Custom(serde_json::to_string(&SetupError {
                error_key: ErrorKey::SteamAccount,
                message: "Failed to find any accounts in your Steam [[userdata]] folder."
                    .to_string(),
                platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
            })?));
        }

        // Enable Steam
        config.steam.enabled = true;
    } else {
        // TODO: revert background if set

        config.steam.profiles = None;
        config.steam.configs = None;
        config.steam.enabled = false;
        config.steam.setup = false;
    }

    // Check if no platforms were enabled
    if config.battle_net.enabled == false && config.steam.enabled == false {
        config.is_setup = false;
        if !is_initialized {
            return Err(Error::Custom(format!(
                "Failed to setup one of your requested platforms: [[{}]].",
                platforms.join("]], [[").replace("BattleNet", "Battle.net")
            )));
        }

        config.background.current = None;
        config.background.is_outdated = false;
    } else {
        config.is_setup = true;
    }

    helpers::write_config(&handle, &config)?;
    return Ok(serde_json::to_string(&config)?);
}

#[tauri::command]
fn resolve_setup_error(
    handle: AppHandle,
    key: &str,
    path: &str,
    platforms: Vec<&str>,
) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    match key {
        "BattleNetInstall" => {
            config.battle_net.install = Some(path.to_string());
        }
        "BattleNetConfig" => {
            config.battle_net.config = Some(path.to_string());
        }
        "SteamInstall" | "SteamAccount" => {
            config.steam.install = Some(path.to_string());
        }
        _ => {
            return Err(Error::Custom(format!(
                "Encountered incorrect setup resolution key [[{}]]. Please report this issue to the developer.", key
            )));
        }
    };

    helpers::write_config(&handle, &config)?;
    return Ok(setup(handle, platforms, false)?);
}

#[tauri::command]
fn get_setup_path(key: &str, handle: AppHandle) -> Result<String, Error> {
    match key {
        "BattleNetInstall" => {
            let path = env::var_os("programfiles(x86)")
                .map(|path| Path::new(&path).join("Battle.net"))
                .filter(|path| path.exists())
                .map(|path| path.to_string_lossy().to_string())
                .unwrap_or_else(|| String::new());

            return Ok(serde_json::to_string(&json!({
                "path": path,
                "defaultPath": path
            }))?);
        }
        "BattleNetConfig" => {
            let path = helpers::display_path_string(
                &handle.path().app_data_dir().unwrap().join("../Battle.net"),
            );

            return Ok(serde_json::to_string(&json!({
                "path": path,
                "defaultPath": path
            }))?);
        }
        "SteamInstall" | "SteamAccount" => {
            let path = env::var_os("programfiles(x86)")
                .map(|path| Path::new(&path).join("Steam"))
                .filter(|path| path.exists())
                .map(|path| path.to_string_lossy().to_string())
                .unwrap_or_else(|| String::new());

            let default_path = env::var_os("windir")
                .map(|os_str| PathBuf::from(os_str))
                .and_then(|path| path.parent().map(PathBuf::from))
                .map(|path| path.to_string_lossy().to_string())
                .unwrap_or_else(|| String::new());

            return Ok(serde_json::to_string(&json!({
                "path": path,
                "defaultPath": default_path
            }))?);
        }
        _ => {
            return Err(Error::Custom(format!(
                "Encountered an incorrect setup key. Please report this issue to the developer."
            )));
        }
    }
}

#[tauri::command]
fn get_steam_accounts(handle: AppHandle) -> Result<String, Error> {
    let config = helpers::read_config(&handle)?;
    let accounts = helpers::get_steam_profiles(&config)?;
    return Ok(serde_json::to_string(&accounts)?);
}

#[tauri::command]
fn confirm_steam_setup(handle: AppHandle) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    if config.steam.configs.is_none() || config.steam.configs.as_ref().unwrap().is_empty() {
        return Err(Error::Custom(
            "Failed to find any accounts in your Steam userdata folder.".to_string(),
        ));
    }

    config.steam.profiles = Some(helpers::get_steam_profiles(&config)?);
    config.steam.setup = true;
    helpers::write_config(&handle, &config)?;
    return Ok(serde_json::to_string(&config)?);
}

#[tauri::command]
fn get_backgrounds() -> String {
    let backgrounds = backgrounds::get_backgrounds();
    let json_result = serde_json::to_string(&backgrounds).unwrap();
    return json_result;
}

#[tauri::command]
fn set_background(handle: AppHandle, id: &str) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    // TODO: Return partial success and errors for each platform
    let mut battle_net_error: Option<Error> = None;
    let mut steam_error: Option<Error> = None;

    'battle_net: {
        if config.battle_net.enabled {
            let battle_net_was_closed = helpers::close_battle_net();
            let battle_net_config = config.battle_net.config.clone().unwrap();
            let battle_net_install = config.battle_net.install.clone().unwrap();

            let battle_net_cleanup: Box<dyn FnOnce()> = Box::new(move || {
                if battle_net_was_closed {
                    // TODO: test error
                    Command::new(battle_net_install).spawn().ok();
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
                    let error = Error::Custom(format!(
                        "Failed to open the [[Battle.net.config]] file at [[{}]]: {}",
                        battle_net_config, e
                    ));

                    battle_net_error = Some(error);
                    break 'battle_net;
                }
            };

            let mut contents = String::new();
            match file.read_to_string(&mut contents) {
                Ok(_) => {}
                Err(e) => {
                    battle_net_cleanup();
                    let error = Error::Custom(format!(
                        "Failed to read [[Battle.net.config]] file at [[{}]]: {}",
                        battle_net_config, e
                    ));

                    battle_net_error = Some(error);
                    break 'battle_net;
                }
            }

            // Parse Battle.net.config file
            let mut json: serde_json::Value = match serde_json::from_str(&contents) {
                Ok(json) => json,
                Err(e) => {
                    battle_net_cleanup();
                    let error = Error::Custom(format!(
                        "Failed to parse [[Battle.net.config]] file at [[{}]]: {}",
                        battle_net_config, e
                    ));

                    battle_net_error = Some(error);
                    break 'battle_net;
                }
            };

            let launch_args = json["Games"]["prometheus"]["AdditionalLaunchArguments"].as_str();
            let new_launch_args = helpers::get_launch_args(launch_args, Some(id));
            json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(new_launch_args);

            let result = helpers::safe_json_write(battle_net_config, &json);
            battle_net_cleanup();
            if let Err(error) = result {
                battle_net_error = Some(error);
                break 'battle_net;
            }
        }
    }

    'steam: {
        if config.steam.enabled {
            let steam_configs = config.steam.configs.clone().unwrap();
            if steam_configs.is_empty() {
                let error = Error::Custom(format!(
                    "Failed to find any accounts in your Steam userdata folder."
                ));
                steam_error = Some(error);
                break 'steam;
            }

            let steam_was_closed = helpers::close_steam(); // true; //
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
            // let mut success = false;
            // for steam_config in steam_configs {
            //     println!("here {}", steam_config.id);

            //     // TODO: handle case when Ovewatch is not installed
            //     let result =
            //         helpers::set_steam_launch_options(steam_config.file.as_str(), Some(id));

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
        }
    }

    if steam_error.is_some() {
        if battle_net_error.is_some() {
            return Err(Error::Custom(format!(
                "Failed to apply background on Battle.net: {}\nFailed to apply background on Steam: {}",
                battle_net_error.unwrap().to_string(),
                steam_error.unwrap().to_string(),
            )));
        } else {
            return Err(steam_error.unwrap());
        }
    } else {
        if battle_net_error.is_some() {
            return Err(battle_net_error.unwrap());
        }
    }

    config.background.current = Some(id.to_string());
    config.background.is_outdated = false;
    helpers::write_config(&handle, &config)?;

    return Ok(serde_json::to_string(&config)?);
}

#[tauri::command]
fn reset_background(handle: AppHandle) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    // TODO: Steam support and Return partial success and errors for each platform
    let mut battle_net_error: Option<Error> = None;
    // let mut steam_error: Option<Error> = None;

    'battle_net: {
        if config.battle_net.enabled {
            let battle_net_was_closed = helpers::close_battle_net();
            let battle_net_config = config.battle_net.config.clone().unwrap();
            let battle_net_install = config.battle_net.install.clone().unwrap();

            let cleanup = || {
                if battle_net_was_closed {
                    Command::new(battle_net_install).spawn().ok();
                }
            };

            // Open Battle.net.config file
            let mut file = match fs::OpenOptions::new()
                .read(true)
                .open(battle_net_config.clone())
            {
                Ok(file) => file,
                Err(e) => {
                    cleanup();
                    let error = Error::Custom(format!(
                        "Failed to open the [[Battle.net.config]] file at [[{}]]: {}",
                        battle_net_config, e
                    ));

                    battle_net_error = Some(error);
                    break 'battle_net;
                }
            };

            let mut contents = String::new();
            match file.read_to_string(&mut contents) {
                Ok(_) => {}
                Err(e) => {
                    cleanup();
                    let error = Error::Custom(format!(
                        "Failed to read [[Battle.net.config]] file at [[{}]]: {}",
                        battle_net_config, e
                    ));

                    battle_net_error = Some(error);
                    break 'battle_net;
                }
            }

            // Parse Battle.net.config file
            let mut json: serde_json::Value = match serde_json::from_str(&contents) {
                Ok(json) => json,
                Err(e) => {
                    cleanup();
                    let error = Error::Custom(format!(
                        "Failed to parse [[Battle.net.config]] file at [[{}]]: {}",
                        battle_net_config, e
                    ));

                    battle_net_error = Some(error);
                    break 'battle_net;
                }
            };

            if let Some(arguments) =
                json["Games"]["prometheus"]["AdditionalLaunchArguments"].as_str()
            {
                let filtered_args = helpers::get_launch_args(Some(arguments), None);
                json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(filtered_args);
                helpers::safe_json_write(battle_net_config, &json)?;
            }
            cleanup();
        } else {
            return Err(Error::Custom(format!("No platforms are connected.")));
        }
    }

    if battle_net_error.is_some() {
        return Err(battle_net_error.unwrap());
    }

    config.background.current = None;
    config.background.is_outdated = false;
    helpers::write_config(&handle, &config)?;

    return Ok(serde_json::to_string(&config)?);
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct SettingsData {
    platforms: Vec<String>,
    steam_profiles: Option<Vec<config::SteamProfile>>,
}

#[tauri::command]
fn get_settings_data(handle: AppHandle) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    if config.steam.enabled && config.steam.setup {
        config.steam.profiles = Some(helpers::get_steam_profiles(&config)?);
        helpers::write_config(&handle, &config)?;
    } else {
        config.steam.profiles = None;
    }

    let mut platforms = vec![];
    let mut steam_profiles = None;
    if config.steam.enabled {
        platforms.push("Steam".to_string());
        steam_profiles = config.steam.profiles;
    }
    if config.battle_net.enabled {
        platforms.push("BattleNet".to_string());
    }
    let settings = SettingsData {
        platforms,
        steam_profiles,
    };
    return Ok(serde_json::to_string(&settings)?);
}

#[tauri::command]
fn reset(handle: AppHandle) -> Result<String, Error> {
    let config = config::get_default_config();
    helpers::write_config(&handle, &config)?;
    return Ok(serde_json::to_string(&config)?);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            mounted,
            get_launch_config,
            setup,
            resolve_setup_error,
            get_setup_path,
            get_steam_accounts,
            confirm_steam_setup,
            get_backgrounds,
            set_background,
            reset_background,
            get_settings_data,
            reset
        ])
        .run(tauri::generate_context!())
        .expect("Encountered an error while starting OverBuddy");
}
