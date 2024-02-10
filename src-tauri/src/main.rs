// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backgrounds;
mod config;
mod helpers;

// use helpers::close_battle_net;
use helpers::Error;

use serde::Serialize;
use serde_json::json;
use serde_json::Serializer;
use std::env;
use std::fs;
use std::io::Read;
use std::path::Path;
// use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Window;

#[tauri::command]
fn mounted(window: Window) {
    thread::sleep(Duration::from_millis(500));
    let window = window.get_window("main").unwrap();
    window.show().unwrap();
    window.set_focus().unwrap();
}

#[tauri::command]
fn get_launch_config(handle: AppHandle) -> Result<String, Error> {
    let config = helpers::read_config(&handle)?;
    println!("Launched with {:?}", config);
    helpers::write_config(&handle, &config)?;

    return Ok(serde_json::to_string(&config)?);
}

#[derive(Serialize)]
enum ErrorKey {
    NoOverwatch,
    BattleNetInstall,
    BattleNetConfig,
    SteamInstall,
    // SteamConfig,
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
                                "Failed to find \"{}\" in {}.",
                                CONFIG_FILE, display_path
                            ),
                            error_action: Some("finding".to_string()),
                            platforms: Some(platforms.iter().map(|s| s.to_string()).collect()),
                        })?));
                    }
                } else {
                    return Err(Error::Custom(serde_json::to_string(&SetupError {
                        error_key: ErrorKey::BattleNetConfig,
                        message: "Failed to find Battle.net AppData directory.".to_string(),
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
                        "Failed to open \"{}\" file at {}",
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
                        "Failed to read \"{}\" file at {}",
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
            }
            let mut file = fs::OpenOptions::new()
                .write(true)
                .truncate(true)
                .open(battle_net_config)?;

            let pretty_formatter = serde_json::ser::PrettyFormatter::with_indent(b"    ");
            let mut serializer = Serializer::with_formatter(&mut file, pretty_formatter);
            json.serialize(&mut serializer)?;
        }

        // Enable Battle.net
        config.battle_net.enabled = true;
    }

    if platforms.contains(&"Steam") {
        // Check if Battle.net is installed
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

        // Check if Steam config exists
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
                "Failed to find the \"Program Files (x86)\" directory."
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
                "Failed to find the \"Program Files (x86)\" directory."
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
fn set_background(handle: AppHandle, id: &str) -> Result<(), Error> {
    // TODO: set background
    return Err(Error::Custom(format!(
        "Failed to find Battle.net Launcher."
    )));

    // let config = read_config(&handle)?;
    // let battle_net_was_closed = close_battle_net();
    // let battle_net_config = config.battle_net_config.unwrap();

    // let cleanup = || {
    //     if battle_net_was_closed {
    //         Command::new(config.battle_net_install.unwrap())
    //             .spawn()
    //             .ok();
    //     }
    // };

    // let mut file = match fs::OpenOptions::new()
    //     .read(true)
    //     .open(battle_net_config.clone())
    // {
    //     Ok(file) => file,
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to open Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };
    // let mut contents = String::new();
    // match file.read_to_string(&mut contents) {
    //     Ok(_) => {}
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to read Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // }

    // let mut json: serde_json::Value = match serde_json::from_str(&contents) {
    //     Ok(json) => json,
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to parse Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };

    // let launch_args = json["Games"]["prometheus"]["AdditionalLaunchArguments"]
    //     .as_str()
    //     .map(|s| s.to_string());

    // let new_arg = format!("--lobbyMap={}", id);
    // let launch_args: String = match launch_args {
    //     Some(arguments) => {
    //         let filtered_args = arguments
    //             .split_whitespace()
    //             .filter(|&part| !part.starts_with("--lobbyMap"))
    //             .collect::<Vec<&str>>()
    //             .join(" ");

    //         if !filtered_args.is_empty() {
    //             format!("{} {}", new_arg, filtered_args)
    //         } else {
    //             new_arg
    //         }
    //     }
    //     None => new_arg,
    // };

    // json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(launch_args);

    // let mut file = match fs::OpenOptions::new()
    //     .write(true)
    //     .truncate(true)
    //     .open(battle_net_config.clone())
    // {
    //     Ok(file) => file,
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to open Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };

    // let pretty_formatter = serde_json::ser::PrettyFormatter::with_indent(b"    ");
    // let mut serializer = Serializer::with_formatter(&mut file, pretty_formatter);
    // match json.serialize(&mut serializer) {
    //     Ok(_) => {}
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to write to Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };

    // cleanup();
    // return Ok(());
}

#[tauri::command]
fn reset_background(handle: AppHandle) -> Result<(), Error> {
    // TODO: reset background
    return Err(Error::Custom(format!(
        "Failed to find Battle.net Launcher."
    )));

    // let config = read_config(&handle)?;
    // let battle_net_was_closed = close_battle_net();
    // let battle_net_config = config.battle_net_config.unwrap();

    // let cleanup = || {
    //     if battle_net_was_closed {
    //         Command::new(config.battle_net_install.unwrap())
    //             .spawn()
    //             .ok();
    //     }
    // };

    // let mut file = match fs::OpenOptions::new()
    //     .read(true)
    //     .open(battle_net_config.clone())
    // {
    //     Ok(file) => file,
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to open Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };
    // let mut contents = String::new();
    // match file.read_to_string(&mut contents) {
    //     Ok(_) => {}
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to read Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // }

    // let mut json: serde_json::Value = match serde_json::from_str(&contents) {
    //     Ok(json) => json,
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to parse Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };

    // let launch_args = json["Games"]["prometheus"]["AdditionalLaunchArguments"]
    //     .as_str()
    //     .map(|s| s.to_string());
    // let launch_args: String = match launch_args {
    //     Some(arguments) => {
    //         let filtered_args = arguments
    //             .split_whitespace()
    //             .filter(|&part| !part.starts_with("--lobbyMap"))
    //             .collect::<Vec<&str>>()
    //             .join(" ");

    //         filtered_args
    //     }
    //     None => {
    //         cleanup();
    //         return Ok(());
    //     }
    // };

    // json["Games"]["prometheus"]["AdditionalLaunchArguments"] = json!(launch_args);

    // let mut file = match fs::OpenOptions::new()
    //     .write(true)
    //     .truncate(true)
    //     .open(battle_net_config.clone())
    // {
    //     Ok(file) => file,
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to open Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };

    // let pretty_formatter = serde_json::ser::PrettyFormatter::with_indent(b"    ");
    // let mut serializer = Serializer::with_formatter(&mut file, pretty_formatter);
    // match json.serialize(&mut serializer) {
    //     Ok(_) => {}
    //     Err(_) => {
    //         cleanup();
    //         return Err(Error::Custom(format!(
    //             "Failed to write to Battle.net.config file at {}",
    //             battle_net_config
    //         )));
    //     }
    // };

    // cleanup();
    // return Ok(());
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
            reset_background
        ])
        .run(tauri::generate_context!())
        .expect("Encountered an error while starting OverBuddy");
}
