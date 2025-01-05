use serde::Serialize;
use serde_json::{from_reader, Serializer, Value};
use std::fs::{self, File};
use std::io::{self};
use std::path::{Path, PathBuf};

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
    dunce::canonicalize(path)
        .map(|canonicalized| canonicalized.display().to_string())
        .map_err(|err| {
            Error::Custom(format!(
                "Error processing path [[{}]]: {:?}",
                path.display(),
                err
            ))
        })
}

pub fn get_file_name_from_path(path: &str) -> Option<&str> {
    Path::new(path).file_name().and_then(|name| name.to_str())
}

// Background helpers

// Update launch arguments
pub fn get_launch_args(launch_args: Option<&str>, id: Option<&str>) -> String {
    let new_arg: Option<String> = if id.is_some() {
        Some(format!("--lobbyMap={}", id.unwrap()))
    } else {
        None
    };

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

    if let Some(arg) = new_arg {
        arg
    } else {
        String::new()
    }
}

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
