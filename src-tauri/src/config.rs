#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct BattleNetConfig {
    pub enabled: bool,
    pub config: Option<String>,
    pub install: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SteamConfig {
    pub enabled: bool,
    pub config: Option<String>,
    pub install: Option<String>,
    pub available_configs: Option<Vec<String>>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct BackgroundConfig {
    pub current: Option<String>,
    pub is_outdated: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct Config {
    pub is_setup: bool,
    pub battle_net: BattleNetConfig,
    pub steam: SteamConfig,
    pub background: BackgroundConfig,
}

pub static CONFIG_FILE: &'static str = "data.json";

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
            config: None,
            install: None,
            available_configs: None,
        },
        background: BackgroundConfig {
            current: None,
            is_outdated: false,
        },
    }
}
