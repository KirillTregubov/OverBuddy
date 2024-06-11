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
use std::path::Path;
use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Window;

#[tauri::command]
fn mounted(window: Window) {
    let window = window.get_window("main").unwrap();
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
                        "Failed to open [[{}]] file at [[{}]]",
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
    SteamConfig,
}
#[derive(Serialize)]
struct SetupError {
    error_key: ErrorKey,
    message: String,
    error_action: Option<String>,
    platforms: Option<Vec<String>>,
}

#[tauri::command]
fn setup(handle: AppHandle, platforms: Vec<&str>) -> Result<String, Error> {
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
                error_action: Some("finding".to_string()),
                platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
            })?));
        }

        // Check if Battle.net config exists
        static CONFIG_FILE: &str = "Battle.net.config";
        let battle_net_config = match &config.battle_net.config {
            Some(battle_net_config) => battle_net_config.clone(),
            None => {
                let app_data_dir = handle.path_resolver().app_data_dir().unwrap();
                let resource_path = app_data_dir.join("../Battle.net");

                // Check if the target file exists in the directory
                if let Ok(entries) = fs::read_dir(&resource_path) {
                    if let Some(target_entry) = entries
                        .filter_map(|entry| entry.ok()) // Filter out errors
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
                            error_action: Some("finding".to_string()),
                            platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                        })?));
                    }
                } else {
                    return Err(Error::Custom(serde_json::to_string(&SetupError {
                        error_key: ErrorKey::BattleNetConfig,
                        message: "Failed to find the Battle.net AppData directory.".to_string(),
                        error_action: Some("finding".to_string()),
                        platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                    })?));
                }
            }
        };

        let mut file = match fs::OpenOptions::new()
            .read(true)
            .open(battle_net_config.clone())
        {
            Ok(file) => file,
            Err(_) => {
                return Err(Error::Custom(serde_json::to_string(&SetupError {
                    error_key: ErrorKey::BattleNetConfig,
                    message: format!(
                        "Failed to open [[{}]] file in [[{}]]",
                        CONFIG_FILE, battle_net_config
                    ),
                    error_action: Some("opening".to_string()),
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
                    error_action: Some("reading".to_string()),
                    platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                })?));
            }
        };
        let mut json: serde_json::Value = serde_json::from_str(&contents)?;

        // Check Overwatch installation
        if json
            .get("Games")
            .and_then(|games| games.get("prometheus"))
            .is_none()
        {
            return Err(Error::Custom(serde_json::to_string(&SetupError {
                error_key: ErrorKey::NoOverwatch,
                message: "You do not have Overwatch installed on Battle.net.".to_string(),
                error_action: None,
                platforms: None,
            })?));
        }

        // Check and create AdditionalLaunchArguments if it doesn't exist
        if let Some(game_config) = json
            .get_mut("Games")
            .and_then(|games| games.get_mut("prometheus"))
        {
            if game_config.get("AdditionalLaunchArguments").is_none() {
                game_config
                    .as_object_mut()
                    .unwrap()
                    .insert("AdditionalLaunchArguments".to_string(), json!(""));

                let battle_net_was_closed = helpers::close_battle_net();

                helpers::safe_json_write(battle_net_config, &json)?;

                if battle_net_was_closed {
                    // TODO: test error
                    Command::new(config.battle_net.install.clone().unwrap())
                        .spawn()
                        .ok();
                }
            } else {
                let launch_args = json["Games"]["prometheus"]["AdditionalLaunchArguments"]
                    .as_str()
                    .map(|s| s.to_string());
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
                        }
                    }
                    None => (),
                };
            }
        }

        // Enable Battle.net
        config.battle_net.enabled = true;
    }

    if platforms.contains(&"Steam") {
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
                error_action: Some("finding".to_string()),
                platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
            })?));
        }

        let steam_install = config.steam.install.clone().unwrap();
        println!("Config: {:?}", config);

        // Check if Steam config exists
        static CONFIG_FILE: &str = "localconfig.vdf";

        let steam_path = Path::new(&steam_install)
            .parent()
            .expect("Failed to get parent directory of the executable");
        let userdata_path = steam_path.join("userdata");

        if userdata_path.exists() && userdata_path.is_dir() {
            match fs::read_dir(&userdata_path) {
                Ok(entries) => {
                    for entry in entries.filter_map(Result::ok) {
                        let config_path = entry.path().join("config");
                        let config_file_path = config_path.join(CONFIG_FILE);
                        if config_file_path.exists() && config_file_path.is_file() {
                            println!("Found config file: {:?}", config_file_path);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to read directory: {}", e);
                }
            }
        } else {
            eprintln!("Userdata path does not exist or is not a directory");
        }

        return Err(Error::Custom(serde_json::to_string(&SetupError {
            error_key: ErrorKey::SteamConfig,
            message: format!(
                "Failed to find [[{}]] in [[{}]].",
                CONFIG_FILE,
                userdata_path.to_string_lossy().to_string()
            ),
            error_action: Some("finding".to_string()),
            platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
        })?));

        return Err(Error::Custom("Not implemented yet".to_string()));
        // TODO: Implement Steam setup

        // Enable Steam
        // config.steam.enabled = true;
    }

    config.is_setup = true;
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
            helpers::write_config(&handle, &config)?;
        }
        "BattleNetConfig" => {
            config.battle_net.config = Some(path.to_string());
            helpers::write_config(&handle, &config)?;
        }
        "SteamInstall" => {
            config.steam.install = Some(path.to_string());
            helpers::write_config(&handle, &config)?;
        }
        _ => {
            return Err(Error::Custom(format!(
                "Encountered an incorrect setup resolution key. Please report this issue to the developer."
            )));
        }
    };

    return Ok(setup(handle, platforms)?);
}

#[tauri::command]
fn get_setup_path(key: &str, handle: AppHandle) -> Result<String, Error> {
    match key {
        "BattleNetInstall" => {
            if let Some(path) = env::var_os("programfiles(x86)") {
                let path = Path::new(path.to_str().unwrap()).join("Battle.net");
                return Ok(path.to_string_lossy().to_string());
            }
            return Err(Error::Custom(format!(
                "Failed to find the [[Program Files (x86)]] directory."
            )));
        }
        "BattleNetConfig" => {
            let app_data_dir = handle.path_resolver().app_data_dir().unwrap();
            let resource_path = app_data_dir.join("../Battle.net");
            return Ok(helpers::display_path_string(&resource_path)?);
        }
        "SteamInstall" => {
            if let Some(path) = env::var_os("programfiles(x86)") {
                let path = Path::new(path.to_str().unwrap()).join("Steam");
                return Ok(path.to_string_lossy().to_string());
            }
            return Err(Error::Custom(format!(
                "Failed to find the [[Program Files (x86)]] directory."
            )));
        }
        _ => {
            return Err(Error::Custom(format!(
                "Encountered an incorrect setup key. Please report this issue to the developer."
            )));
        }
    }
}

#[tauri::command]
fn get_backgrounds() -> String {
    let backgrounds = backgrounds::get_backgrounds();
    let json_result = serde_json::to_string(&backgrounds).unwrap();
    return json_result;
}

// fn update_background

#[tauri::command]
fn set_background(handle: AppHandle, id: &str) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    // TODO: Steam support and fix this error
    if config.battle_net.enabled == false {
        return Err(Error::Custom(format!("Battle.net is not enabled.")));
    }

    let battle_net_was_closed = helpers::close_battle_net();
    let battle_net_config = config.battle_net.config.clone().unwrap();
    let battle_net_install = config.battle_net.install.clone().unwrap();

    let cleanup = || {
        if battle_net_was_closed {
            // TODO: test error
            Command::new(battle_net_install).spawn().ok();
        }
    };

    let mut file = match fs::OpenOptions::new()
        .read(true)
        .open(battle_net_config.clone())
    {
        Ok(file) => file,
        Err(_) => {
            cleanup();
            return Err(Error::Custom(format!(
                "Failed to open Battle.net.config file at {}",
                battle_net_config
            )));
        }
    };
    let mut contents = String::new();
    match file.read_to_string(&mut contents) {
        Ok(_) => {}
        Err(_) => {
            cleanup();
            return Err(Error::Custom(format!(
                "Failed to read Battle.net.config file at {}",
                battle_net_config
            )));
        }
    }

    let mut json: serde_json::Value = match serde_json::from_str(&contents) {
        Ok(json) => json,
        Err(_) => {
            cleanup();
            return Err(Error::Custom(format!(
                "Failed to parse Battle.net.config file at {}",
                battle_net_config
            )));
        }
    };

    let launch_args = json["Games"]["prometheus"]["AdditionalLaunchArguments"].as_str();

    let new_arg = format!("--lobbyMap={}", id);
    let launch_args: String = match launch_args {
        Some(arguments) => {
            let filtered_args = arguments
                .split_whitespace()
                .filter(|&part| !part.starts_with("--lobbyMap"))
                .collect::<Vec<&str>>()
                .join(" ");

            if !filtered_args.is_empty() {
                format!("{} {}", new_arg, filtered_args)
            } else {
                new_arg
            }
        }
        None => new_arg,
    };

    json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(launch_args);
    helpers::safe_json_write(battle_net_config, &json)?;

    config.background.current = Some(id.to_string());
    config.background.is_outdated = false;
    helpers::write_config(&handle, &config)?;

    cleanup();
    return Ok(serde_json::to_string(&config)?);
}

#[tauri::command]
fn reset_background(handle: AppHandle) -> Result<String, Error> {
    let mut config = helpers::read_config(&handle)?;

    // TODO: Steam support and fix this error
    if config.battle_net.enabled == false {
        return Err(Error::Custom(format!("Battle.net is not enabled.")));
    }

    let battle_net_was_closed = helpers::close_battle_net();
    let battle_net_config = config.battle_net.config.clone().unwrap();
    let battle_net_install = config.battle_net.install.clone().unwrap();

    let cleanup = || {
        if battle_net_was_closed {
            Command::new(battle_net_install).spawn().ok();
        }
    };

    let mut file = match fs::OpenOptions::new()
        .read(true)
        .open(battle_net_config.clone())
    {
        Ok(file) => file,
        Err(_) => {
            cleanup();
            return Err(Error::Custom(format!(
                "Failed to open Battle.net.config file at {}",
                battle_net_config
            )));
        }
    };
    let mut contents = String::new();
    match file.read_to_string(&mut contents) {
        Ok(_) => {}
        Err(_) => {
            cleanup();
            return Err(Error::Custom(format!(
                "Failed to read Battle.net.config file at {}",
                battle_net_config
            )));
        }
    }

    let mut json: serde_json::Value = match serde_json::from_str(&contents) {
        Ok(json) => json,
        Err(_) => {
            cleanup();
            return Err(Error::Custom(format!(
                "Failed to parse Battle.net.config file at {}",
                battle_net_config
            )));
        }
    };

    match json["Games"]["prometheus"]["AdditionalLaunchArguments"]
        .as_str()
        .map(|s| s.to_string())
    {
        Some(arguments) => {
            let filtered_args = arguments
                .split_whitespace()
                .filter(|&part| !part.starts_with("--lobbyMap"))
                .collect::<Vec<&str>>()
                .join(" ");

            json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(filtered_args);
            helpers::safe_json_write(battle_net_config, &json)?;
        }
        None => (),
    };

    config.background.current = None;
    config.background.is_outdated = false;
    helpers::write_config(&handle, &config)?;

    cleanup();
    return Ok(serde_json::to_string(&config)?);
}

#[tauri::command]
fn reset(handle: AppHandle) -> Result<String, Error> {
    let config = config::get_default_config();
    helpers::write_config(&handle, &config)?;
    return Ok(serde_json::to_string(&config)?);
}

fn main() {
    tauri::Builder::default()
        // .setup(|app| {
        //     let splashscreen_window = app.get_window("splashscreen").unwrap();
        //     let main_window = app.get_window("main").unwrap();
        //     // we perform the initialization code on a new task so the app doesn't freeze
        //     tauri::async_runtime::spawn(async move {
        //         // initialize your app here instead of sleeping :)
        //         println!("Initializing...");
        //         std::thread::sleep(std::time::Duration::from_secs(2));
        //         println!("Done initializing.");
        //         // After it's done, close the splashscreen and display the main window
        //         splashscreen_window.close().unwrap();
        //         main_window.show().unwrap();
        //     });
        //     Ok(())
        // })
        .invoke_handler(tauri::generate_handler![
            mounted,
            get_launch_config,
            setup,
            get_setup_path,
            resolve_setup_error,
            get_backgrounds,
            set_background,
            reset_background,
            reset
        ])
        .run(tauri::generate_context!())
        .expect("Encountered an error while starting OverBuddy");
}
