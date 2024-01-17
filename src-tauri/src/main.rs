// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use serde_json::json;
use serde_json::Serializer;
use std::env;
use std::fs;
use std::io::Read;
use std::path::Path;
use std::process::Command;
use sysinfo::System;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Window;

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),

    #[error("{0}")]
    Custom(String),
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

fn display_path_string(path: &std::path::PathBuf) -> Result<String, Error> {
    dunce::canonicalize(&path)
        .map(|canonicalized| canonicalized.display().to_string())
        .map_err(|err| {
            let result = format!("Error processing path: {:?}", err);
            // eprintln!("{}", result);
            Error::Custom(result)
        })
}

fn close_battle_net() -> Result<bool, Error> {
    let mut flag = false;
    let system = System::new_all();
    for process in system.processes_by_name("Battle.net.exe") {
        if process.kill() {
            flag = true;
        }
    }

    Ok(flag)
}

// fn is_battle_net_running() -> Result<bool, Error> {
//     let system = System::new_all();
//     for _ in system.processes_by_name("Battle.net.exe") {
//         return Ok(true);
//     }

//     Ok(false)
// }

#[tauri::command]
fn mounted(window: Window) {
    std::thread::sleep(std::time::Duration::from_millis(500));
    let window = window.get_window("main").unwrap();
    window.show().unwrap();
    window.set_focus().unwrap();
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct Config {
    is_setup: bool,
    battle_net_config: Option<String>,
    battle_net_install: Option<String>,
}
static CONFIG_FILE: &'static str = "data.json";
fn get_default_config() -> Config {
    Config {
        is_setup: false,
        battle_net_config: None,
        battle_net_install: None,
    }
}

fn read_config(handle: &AppHandle) -> Result<Config, Error> {
    let app_local_data_dir = handle.path_resolver().app_local_data_dir().unwrap();

    // Ensure directory exists
    if !app_local_data_dir.exists() {
        match fs::create_dir_all(&app_local_data_dir) {
            Ok(_) => {}
            Err(_) => {
                let result = format!("Failed to create directory: {:?}", app_local_data_dir);
                return Err(Error::Custom(result));
            }
        }
    }

    // Ensure file exists
    let config_file_path = app_local_data_dir.join(CONFIG_FILE);
    if !config_file_path.exists() {
        match fs::File::create(&config_file_path) {
            Ok(_) => {}
            Err(_) => {
                let result = format!("Failed to create file: {:?}", config_file_path);
                // eprintln!("{}", result);
                return Err(Error::Custom(result));
            }
        }
    }

    // Get config
    let config = match fs::read_to_string(&config_file_path) {
        Ok(contents) => contents,
        Err(_) => String::new(),
    };
    let config: Config = match serde_json::from_str(&config) {
        Ok(json) => {
            let result: Result<Config, _> = serde_json::from_value(json);
            match result {
                Ok(config) => config,
                Err(_) => get_default_config(),
            }
        }
        Err(_) => get_default_config(),
    };

    return Ok(config);
}

fn write_config(handle: &AppHandle, config: &Config) -> Result<(), Error> {
    let app_local_data_dir = handle.path_resolver().app_local_data_dir().unwrap();

    // Ensure directory exists
    if !app_local_data_dir.exists() {
        match fs::create_dir_all(&app_local_data_dir) {
            Ok(_) => {}
            Err(_) => {
                let result = format!("Failed to create directory: {:?}", app_local_data_dir);
                // eprintln!("{}", result);
                return Err(Error::Custom(result));
            }
        }
    }

    // Ensure file exists
    let config_file_path = app_local_data_dir.join(CONFIG_FILE);
    if !config_file_path.exists() {
        match fs::File::create(&config_file_path) {
            Ok(_) => {}
            Err(_) => {
                let result = format!("Failed to create file: {:?}", config_file_path);
                // eprintln!("{}", result);
                return Err(Error::Custom(result));
            }
        }
    }

    // Write config
    let serialized_config = serde_json::to_string(&config)?;
    match fs::write(&config_file_path, &serialized_config) {
        Ok(_) => {}
        Err(_) => {
            let result = format!("Failed to write to file: {:?}", config_file_path);
            // eprintln!("{}", result);
            return Err(Error::Custom(result));
        }
    }

    return Ok(());
}

#[tauri::command]
fn get_launch_config(handle: AppHandle) -> Result<String, Error> {
    let config = read_config(&handle)?;
    write_config(&handle, &config)?;

    return Ok(serde_json::to_string(&config)?);
}

#[derive(serde::Serialize)]
enum ErrorKey {
    NoOverwatch,
    BattleNetConfig,
    BattleNetInstall,
}

#[derive(serde::Serialize)]
struct SetupError {
    message: String,
    error_key: ErrorKey,
}

fn fetch_battle_net_config(handle: &AppHandle) -> Result<String, Error> {
    let app_data_dir = handle.path_resolver().app_data_dir().unwrap();
    let resource_path = app_data_dir.join("../Battle.net");
    let target_file_name = "Battle.net.config";

    // Check if the target file exists in the directory
    if let Ok(entries) = fs::read_dir(&resource_path) {
        if let Some(target_entry) = entries
            .filter_map(|entry| entry.ok()) // Filter out errors
            .find(|entry| entry.file_name().to_string_lossy() == target_file_name)
        {
            let display_path = display_path_string(&target_entry.path())?;
            return Ok(display_path);
        } else {
            let display_path = display_path_string(&resource_path)?;
            let result = format!(
                "Unable to find \"{}\" in {}.",
                target_file_name, display_path
            );

            return Err(Error::Custom(serde_json::to_string(&SetupError {
                message: result,
                error_key: ErrorKey::BattleNetConfig,
            })?));
        }
    } else {
        let result = format!("Failed to find Battle.net AppData directory.");
        return Err(Error::Custom(serde_json::to_string(&SetupError {
            message: result,
            error_key: ErrorKey::BattleNetConfig,
        })?));
    }
}

#[tauri::command]
fn setup(handle: AppHandle) -> Result<String, Error> {
    let mut config = read_config(&handle)?;

    let battle_net_config = match &config.battle_net_config {
        Some(battle_net_config) => battle_net_config.clone(),
        None => {
            let battle_net_config = fetch_battle_net_config(&handle)?;
            config.battle_net_config = Some(battle_net_config.clone());
            battle_net_config
        }
    };
    // let battle_net_config = fetch_battle_net_config(&handle)?;
    // config.battle_net_config = Some(battle_net_config.clone());
    let mut file = fs::OpenOptions::new()
        .read(true)
        .open(battle_net_config.clone())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let mut json: serde_json::Value = serde_json::from_str(&contents)?;

    if json
        .get("Games")
        .and_then(|games| games.get("prometheus"))
        .is_none()
    {
        return Err(Error::Custom(serde_json::to_string(&SetupError {
            message: "You do not have Overwatch installed on Battle.net.".to_string(),
            error_key: ErrorKey::NoOverwatch,
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

    let relative_path = "Battle.net\\Battle.net Launcher.exe";
    if let Some(program_files_dir) = env::var_os("programfiles(x86)") {
        let battle_net_install = Path::new(program_files_dir.to_str().unwrap()).join(relative_path);
        if battle_net_install.exists() {
            config.battle_net_install = Some(battle_net_install.to_string_lossy().to_string());
        }
    }
    if config.battle_net_install.is_none() {
        return Err(Error::Custom(serde_json::to_string(&SetupError {
            message: "Failed to find Battle.net Launcher.".to_string(),
            error_key: ErrorKey::BattleNetInstall,
        })?));
    }

    config.is_setup = true;
    write_config(&handle, &config)?;

    return Ok(serde_json::to_string(&config)?);
}

#[tauri::command]
fn resolve_setup_error(handle: AppHandle, key: &str, path: &str) -> Result<String, Error> {
    let mut config = read_config(&handle)?;

    match key {
        "BattleNetConfig" => {
            config.battle_net_config = Some(path.to_string());
            write_config(&handle, &config)?;
        }
        "BattleNetInstall" => {
            config.battle_net_install = Some(path.to_string());
            write_config(&handle, &config)?;
        }
        _ => {
            return Err(Error::Custom(format!("Incorrect setup resolution.")));
        }
    };

    return Ok(setup(handle)?);
}

#[tauri::command]
fn get_program_data() -> Result<String, Error> {
    if let Some(program_files_dir) = env::var_os("programfiles(x86)") {
        return Ok(program_files_dir.to_str().unwrap().to_string());
    }

    return Err(Error::Custom(format!(
        "Failed to find program files directory."
    )));
}

#[tauri::command]
fn set_background(handle: AppHandle, id: &str) -> Result<(), Error> {
    let config = read_config(&handle)?;
    let battle_net_was_closed = close_battle_net()?;

    let battle_net_config = config.battle_net_config.unwrap();

    let mut file = fs::OpenOptions::new()
        .read(true)
        .open(battle_net_config.clone())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let mut json: serde_json::Value = serde_json::from_str(&contents)?;

    let launch_args = json["Games"]["prometheus"]["AdditionalLaunchArguments"]
        .as_str()
        .map(|s| s.to_string());

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

    let mut file = fs::OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(battle_net_config.clone())?;

    let pretty_formatter = serde_json::ser::PrettyFormatter::with_indent(b"    ");
    let mut serializer = Serializer::with_formatter(&mut file, pretty_formatter);
    json.serialize(&mut serializer)?;

    if battle_net_was_closed {
        Command::new(config.battle_net_install.unwrap())
            .spawn()
            .ok();
    }

    return Ok(());
}

mod backgrounds;

// #[derive(serde::Serialize)]
// struct Background {
//     id: String,
//     image: String,
//     name: String,
// }

#[tauri::command]
fn get_backgrounds() -> String {
    let backgrounds = backgrounds::get_backgrounds();
    let json_result = serde_json::to_string(&backgrounds).unwrap();
    return json_result;
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
            resolve_setup_error,
            get_program_data,
            set_background,
            get_backgrounds
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
