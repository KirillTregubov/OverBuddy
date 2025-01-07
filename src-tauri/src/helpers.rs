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

// Generate background launch arguments
pub const BACKGROUND_LAUNCH_ARG: &str = "--lobbyMap";
pub fn generate_background_launch_args(launch_args: Option<&str>, id: Option<&str>) -> String {
    let new_arg = id.map(|id| format!("{}={}", BACKGROUND_LAUNCH_ARG, id));

    let filtered_args = launch_args
        .map(|args| {
            args.split_whitespace()
                .filter(|&part| !part.starts_with(BACKGROUND_LAUNCH_ARG))
                .collect::<Vec<_>>()
                .join(" ")
        })
        .unwrap_or_default();

    match (filtered_args.is_empty(), new_arg) {
        (true, Some(arg)) => arg,
        (false, Some(arg)) => format!("{} {}", filtered_args, arg),
        (false, None) => filtered_args,
        (true, None) => String::new(),
    }
}

// Generate debug console launch arguments
pub const CONSOLE_LAUNCH_ARG: &str = "--tank_Console";
pub fn generate_console_launch_args(launch_args: Option<&str>, enable_console: bool) -> String {
    let new_arg = if enable_console {
        Some(CONSOLE_LAUNCH_ARG.to_string())
    } else {
        None
    };

    let filtered_args = launch_args
        .map(|args| {
            args.split_whitespace()
                .filter(|&part| part != CONSOLE_LAUNCH_ARG)
                .collect::<Vec<_>>()
                .join(" ")
        })
        .unwrap_or_default();

    match (filtered_args.is_empty(), new_arg) {
        (true, Some(arg)) => arg,
        (false, Some(arg)) => format!("{} {}", filtered_args, arg),
        (false, None) => filtered_args,
        (true, None) => String::new(),
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
