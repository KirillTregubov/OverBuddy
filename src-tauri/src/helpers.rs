use crate::config::{get_default_config, Config, CONFIG_FILE};

use serde::Serialize;
use serde_json::{from_reader, Serializer, Value};
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use sysinfo::System;
use tauri::AppHandle;

// create the error type that represents all errors possible in our program
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

pub fn safe_json_write(path: String, json: &serde_json::Value) -> Result<(), Error> {
    // Create backup
    let backup_path = format!("{}.backup", path);
    if Path::new(&path).exists() {
        fs::copy(&path, &backup_path).map_err(|_| {
            Error::Custom(format!(
                "Failed to create backup of [[{}]]",
                get_file_name_from_path(&path).unwrap_or("unknown")
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
