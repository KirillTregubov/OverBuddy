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
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn get_config(handle: tauri::AppHandle) -> Result<(bool, String), Error> {
    // Get the app data directory
    let app_data_dir = handle
        .path_resolver()
        .app_data_dir()
        .expect("failed to get app data directory");

    // Construct the full path to the resource using join
    let resource_path = app_data_dir.join("../Battle.net");

    // Canonicalize the path to resolve any ".." components
    // let canonicalized_path = match resource_path.canonicalize() {
    //     Ok(canonicalized) => canonicalized.display().to_string(),
    //     Err(err) => {
    //         let result = format!("Failed to canonicalize path: {:?}", err);
    //         eprintln!("{}", result);
    //         return Err(Error::Custom(result));
    //     }
    // };

    // let display_path = match dunce::canonicalize(&resource_path) {
    //     Ok(canonicalized) => canonicalized.display().to_string(),
    //     Err(err) => {
    //         let result = format!("Failed to canonicalize path: {:?}", err);
    //         eprintln!("{}", result);
    //         return Err(Error::Custom(result));
    //     }
    // };
    // println!("Canonicalized path: {}", display_path);

    // Specify the file name you're looking for
    let target_file_name = "Battle.net.config";

    // Check if the target file exists in the directory
    if let Ok(entries) = std::fs::read_dir(&resource_path) {
        if let Some(target_entry) = entries
            .filter_map(|entry| entry.ok()) // Filter out errors
            .find(|entry| entry.file_name().to_string_lossy() == target_file_name)
        {
            println!("Found target file: {:?}", target_entry.path());

            let canonical_path = dunce::canonicalize(&target_entry.path())
                .map(|canonicalized| canonicalized.display().to_string());
            if canonical_path.is_err() {
                let result = format!("Failed to canonicalize path: {:?}", canonical_path);
                eprintln!("{}", result);
                return Err(Error::Custom(result));
            }
            let display_path = canonical_path.unwrap();

            // let display_path = match dunce::canonicalize(&resource_path) {
            //     Ok(canonicalized) => canonicalized.display().to_string(),
            //     Err(err) => {
            //         let result = format!("Failed to canonicalize path: {:?}", err);
            //         eprintln!("{}", result);
            //         return Err(Error::Custom(result));
            //     }
            // };
            let result = format!("Found config: {}", display_path);
            // println!("{}", result);
            return Ok((true, result));
        } else {
            let result = format!(
                "Target file not found in the directory: {:?}",
                resource_path
            );
            // println!("{}", result);
            return Ok((false, result));
        }
    } else {
        let result = format!("Failed to read directory: {:?}", resource_path);
        // eprintln!("{}", result);
        return Err(Error::Custom(result));
    }
}

#[tauri::command]
fn set_map(handle: tauri::AppHandle, map: &str) -> Result<String, Error> {
    // let file = std::fs::File::open(&resource_path)?;
    // let lang_de: serde_json::Value = serde_json::from_reader(file)?;
    // lang_de.get("hello").unwrap();

    let (success, result) = get_config(handle)?;

    println!("Success: {}", success);
    println!("Result: {}", result);

    return Ok(result);
    // return Ok(format!("Loading {}!", map));
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, set_map])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
