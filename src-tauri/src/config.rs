#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct BattleNetConfig {
    pub enabled: bool,
    pub config: Option<String>,
    pub install: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SteamConfig {
    pub enabled: bool,
    // pub config: Option<String>,
    pub install: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct Config {
    pub is_setup: bool,
    pub battle_net: BattleNetConfig,
    pub steam: SteamConfig,
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
            // config: None,
            install: None,
        },
    }
}
