use crate::helpers::Error;
use serde_json::Value;
use std::fs;
use tauri::{AppHandle, Manager};

#[derive(serde::Serialize)]
pub enum ErrorKey {
    NoOverwatch,
    BattleNetInstall,
    BattleNetConfig,
    SteamInstall,
    SteamAccount,
}
#[derive(serde::Serialize)]
pub struct SetupError {
    pub error_key: ErrorKey,
    pub message: String,
    pub platforms: Option<Vec<String>>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BattleNetConfig {
    pub enabled: bool,
    pub config: Option<String>,
    pub install: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SteamLocalconfig {
    pub id: String,
    pub file: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SteamProfile {
    pub id: String,
    pub name: String,
    pub avatar: Option<String>,
    pub has_overwatch: bool,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SteamConfig {
    pub enabled: bool,
    pub in_setup: bool,
    pub install: Option<String>,
    pub configs: Option<Vec<SteamLocalconfig>>,
    pub profiles: Option<Vec<SteamProfile>>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BackgroundConfig {
    pub current: Option<String>,
    pub is_outdated: bool,
    pub custom: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct AdditionalConfig {
    pub console_enabled: bool,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SharedConfig {
    pub background: BackgroundConfig,
    pub additional: AdditionalConfig,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Config {
    pub is_setup: bool,
    pub battle_net: BattleNetConfig,
    pub steam: SteamConfig,
    pub shared: SharedConfig,
}

pub fn get_default_config() -> Config {
    Config {
        is_setup: false,
        battle_net: BattleNetConfig {
            enabled: false,
            config: None,
            install: None,
        },
        steam: SteamConfig {
            enabled: false,
            in_setup: false,
            install: None,
            configs: None,
            profiles: None,
        },
        shared: SharedConfig {
            background: BackgroundConfig {
                current: None,
                is_outdated: false,
                custom: None,
            },
            additional: AdditionalConfig {
                console_enabled: false,
            },
        },
    }
}

static CONFIG_FILE: &str = "data.json";

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
    let app_local_data_dir = handle.path().app_local_data_dir().unwrap();

    // Ensure directory exists
    if !app_local_data_dir.exists() {
        match fs::create_dir_all(&app_local_data_dir) {
            Ok(_) => {}
            Err(_) => {
                return Err(Error::Custom(format!(
                    "Failed to read local data at [[{}]]",
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
    let config = fs::read_to_string(&config_file_path).unwrap_or_default();
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

    Ok(config)
}

pub fn write_config(handle: &AppHandle, config: &Config) -> Result<(), Error> {
    let app_local_data_dir = handle.path().app_local_data_dir().unwrap();

    // Ensure directory exists
    if !app_local_data_dir.exists() {
        match fs::create_dir_all(&app_local_data_dir) {
            Ok(_) => {}
            Err(_) => {
                return Err(Error::Custom(format!(
                    "Failed to write local data at [[{}]]",
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
                    "Failed to create configuration file at [[{}]]",
                    config_file_path.to_str().unwrap()
                )));
            }
        }
    }

    // Write config
    let serialized_config = match serde_json::to_string(&config) {
        Ok(json) => json,
        Err(_) => {
            return Err(Error::Custom("Failed to serialize config".into()));
        }
    };
    match fs::write(&config_file_path, &serialized_config) {
        Ok(_) => {}
        Err(_) => {
            return Err(Error::Custom(format!(
                "Failed to write configuration file at [[{}]]",
                config_file_path.to_str().unwrap()
            )));
        }
    }

    Ok(())
}
