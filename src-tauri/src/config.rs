#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct BattleNetConfig {
    pub enabled: bool,
    pub config: Option<String>,
    pub install: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct SteamLocalconfig {
    pub id: String,
    pub file: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SteamProfile {
    pub id: Option<String>,
    pub name: Option<String>,
    pub avatar: Option<String>,
    pub has_overwatch: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SteamConfig {
    pub enabled: bool,
    pub setup: bool,
    pub install: Option<String>,
    pub configs: Option<Vec<SteamLocalconfig>>,
    pub profiles: Option<Vec<SteamProfile>>,
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

pub static CONFIG_FILE: &str = "data.json";

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
            setup: false,
            configs: None,
            profiles: None,
            install: None,
        },
        background: BackgroundConfig {
            current: None,
            is_outdated: false,
        },
    }
}
