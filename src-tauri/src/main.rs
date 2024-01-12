// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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

fn fetch_config(handle: tauri::AppHandle) -> Result<(bool, String), Error> {
    let app_data_dir = handle.path_resolver().app_data_dir().unwrap();
    let resource_path = app_data_dir.join("../Battle.net");
    let target_file_name = "Battle.net.config";

    // Check if the target file exists in the directory
    if let Ok(entries) = std::fs::read_dir(&resource_path) {
        if let Some(target_entry) = entries
            .filter_map(|entry| entry.ok()) // Filter out errors
            .find(|entry| entry.file_name().to_string_lossy() == target_file_name)
        {
            let display_path = display_path_string(&target_entry.path())?;
            let result = format!("Found configuration: {}", display_path);
            // println!("{}", result);
            return Ok((true, result));
        } else {
            let display_path = display_path_string(&resource_path)?;
            let result = format!("File {} not found in {}", target_file_name, display_path);
            // println!("{}", result);
            return Ok((false, result));
        }
    } else {
        let result = format!("Failed to read Battle.net AppData directory.");
        // eprintln!("{}", result);
        return Err(Error::Custom(result));
    }
}

// use serde_json::json;

#[tauri::command]
fn set_map(map: &str) -> Result<String, Error> {
    return Ok(format!("Loading {}!", map));
}

#[derive(serde::Serialize)]
struct JsonResponse {
    success: bool,
    result: String,
}

#[tauri::command]
fn get_config(handle: tauri::AppHandle) -> Result<String, Error> {
    let (success, result) = fetch_config(handle)?;

    let response = JsonResponse {
        success: success,
        result,
    };
    let json_response = serde_json::to_string(&response)?;

    return Ok(json_response);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_map, get_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
