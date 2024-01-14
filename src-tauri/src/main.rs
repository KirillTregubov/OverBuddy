// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use serde_json::json;
use serde_json::Serializer;
use std::fs;
use std::io::Read;
use std::process::Command;
use sysinfo::System;

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

fn fetch_config(handle: &tauri::AppHandle) -> Result<String, Error> {
    let app_data_dir = handle.path_resolver().app_data_dir().unwrap();
    let resource_path = app_data_dir.join("../Battle.net");
    let target_file_name = "Battle.net.config";

    // if let Some(program_data_dir) = std::env::var_os("ProgramData") {
    //     println!("ProgramData directory: {:?}", program_data_dir);
    // } else {
    //     eprintln!("Error getting ProgramData directory");
    // }

    // Check if the target file exists in the directory
    if let Ok(entries) = fs::read_dir(&resource_path) {
        if let Some(target_entry) = entries
            .filter_map(|entry| entry.ok()) // Filter out errors
            .find(|entry| entry.file_name().to_string_lossy() == target_file_name)
        {
            let display_path = display_path_string(&target_entry.path())?;
            // println!("{}", display_path);
            return Ok(display_path);
        } else {
            let display_path = display_path_string(&resource_path)?;
            let result = format!(
                "Battle.net AppData ({}) doesn't contain file \"{}\"",
                display_path, target_file_name
            );
            // println!("{}", result);
            return Err(Error::Custom(result));
        }
    } else {
        let result = format!("Failed to read Battle.net AppData directory.");
        // eprintln!("{}", result);
        return Err(Error::Custom(result));
    }
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

fn is_battle_net_running() -> Result<bool, Error> {
    let system = System::new_all();
    for _ in system.processes_by_name("Battle.net.exe") {
        return Ok(true);
    }

    Ok(false)
}

#[derive(serde::Serialize)]
struct SetupResponse {
    config: String,
}

#[tauri::command]
fn get_setup(handle: tauri::AppHandle) -> Result<String, Error> {
    let config = fetch_config(&handle)?;

    let app_local_data_dir = handle.path_resolver().app_local_data_dir().unwrap();
    println!("AppLocalData directory: {:?}", app_local_data_dir);

    // if let Some(mut app_data_path) = dirs::data_local_dir() {
    //     app_data_path.push("your_app_name"); // Replace "your_app_name" with your actual app name
    //     fs::create_dir_all(&app_data_path)?;

    //     // Create a file path for storing the SetupResponse object
    //     let file_path = app_data_path.join("setup_response.json");

    //     // Write the serialized JSON to the file
    //     fs::write(&file_path, &serialized_response)?;

    //     return Ok(serialized_response);
    // } else {
    //     return Err(Error::Custom(
    //         "Failed to get the path to the application data directory.".to_string(),
    //     ));
    // }

    let response = SetupResponse { config };
    return Ok(serde_json::to_string(&response)?);
}

#[tauri::command]
fn set_background(handle: tauri::AppHandle, name: &str) -> Result<String, Error> {
    let config = fetch_config(&handle)?;
    let battle_net_was_closed = close_battle_net()?;

    println!("Was closed? {}", battle_net_was_closed);

    let mut file = fs::OpenOptions::new().read(true).open(config.clone())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let mut json: serde_json::Value = serde_json::from_str(&contents)?;
    // println!("before: {}", json);

    if json
        .get("Games")
        .and_then(|games| games.get("prometheus"))
        .is_none()
    {
        return Err(Error::Custom(format!(
            "Failed to find Overwatch in your Battle.net config ({})",
            config
        )));
    }

    let launch_args = json["Games"]["prometheus"]["AdditionalLaunchArguments"]
        .as_str()
        .map(|s| s.to_string());

    let new_arg = format!("--lobbyMap={}", "0x0800000000001173");
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
        .open(config)?;

    let pretty_formatter = serde_json::ser::PrettyFormatter::with_indent(b"    ");
    let mut serializer = Serializer::with_formatter(&mut file, pretty_formatter);
    json.serialize(&mut serializer)?;

    // if battle_net_was_closed {
    if let Err(err) =
        Command::new("C:\\Program Files (x86)\\Battle.net\\Battle.net Launcher.exe").spawn()
    {
        eprintln!("Failed to start the external program: {}", err);
    }
    // }

    // println!("\"{}\"", launch_args);
    // println!("\nafter: {}", json);
    return Ok(format!("Setting {}!", name));
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
        .invoke_handler(tauri::generate_handler![
            get_setup,
            set_background,
            get_backgrounds
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
