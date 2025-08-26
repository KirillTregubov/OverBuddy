use serde::Serialize;

#[derive(Serialize)]
pub struct Background {
    pub id: &'static str,
    pub image: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub tags: &'static [&'static str],
    pub new: bool,
}

const BACKGROUNDS: &[Background] = &[
    Background {
        id: "0x0800000000000864",
        image: "overwatch_league.jpg",
        name: "Overwatch League",
        description: "Overwatch League Promo",
        tags: &["Overwatch League", "Silent"],
        new: false,
    },
    Background {
        id: "0x0800000000000E77",
        image: "heroes.jpg",
        name: "Heroes",
        description: "2022 Alpha Test",
        tags: &["Animated"],
        new: false,
    },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000000D6C",
    //     image: "sojourn.jpg",
    //     name: "Sojourn",
    //     description: "2022 PvP Beta",
    //     tags: &[],
    //     new: false,
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000000EF3",
    //     image: "kiriko.jpg",
    //     name: "Kiriko",
    //     description: "Kiriko Release (Season 1)",
    //     tags: vec!["Song: BOW by MFS"],
    // },
    Background {
        id: "0x0800000000000EFB",
        image: "zero_hour.jpg",
        name: "Zero Hour",
        description: "Overwatch 2 Launch",
        tags: &[],
        new: false,
    },
    // NOTE: Broken after Season 13 mid-season patch
    // Background {
    //     id: "0x0800000000000F11",
    //     image: "cyber_demon_genji_green.jpg",
    //     name: "Cyber Demon Genji (Green)",
    //     description: "Season 1 Mythic Skin",
    //     tags: &["Animated"],
    //     new: false
    // },
    // Background {
    //     id: "0x0800000000000EFA",
    //     image: "cyber_demon_genji_red.jpg",
    //     name: "Cyber Demon Genji (Red)",
    //     description: "Season 1 Mythic Skin",
    //     tags: &["Animated"],
    //     new: false
    // },
    // Background {
    //     id: "0x0800000000000F12",
    //     image: "cyber_demon_genji_pink.jpg",
    //     name: "Cyber Demon Genji (Pink)",
    //     description: "Season 1 Mythic Skin",
    //     tags: &["Animated"],
    //     new: false
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000000F8F",
    //     image: "ramattra.jpg",
    //     name: "Ramattra",
    //     description: "Ramattra Release (Season 2)",
    //     tags: vec![],
    // },
    // Background {
    //     id: "0x0800000000000f31",
    //     image: "shambali_monastery.jpg",
    //     name: "Shambali Monastery",
    //     description: "Shambali Monastery Release (Season 2)",
    //     tags: vec!["No Hero"],
    // },
    // Background {
    //     id: "0x0800000000000F4A",
    //     image: "zeus_junker_queen.jpg",
    //     name: "Zeus Junker Queen",
    //     description: "Season 2 Mythic Skin",
    //     tags: vec![],
    // },
    Background {
        id: "0x0800000000000D77",
        image: "winter_wonderland_2022.jpg",
        name: "Festive Junkrat & Roadhog",
        description: "Winter Wonderland 2022 (Season 2)",
        tags: &[],
        new: false,
    },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000000DAD",
    //     image: "mei_lunar_2023.jpg",
    //     name: "Festive Mei",
    //     description: "Lunar New Year 2023 (Season 2)",
    //     tags: &[],
    //     new: false,
    // },
    // Background {
    //     id: "0x0800000000000710",
    //     image: "dva_lunar_2023.jpg",
    //     name: "Palanquin D.Va",
    //     description: "Lunar New Year 2023 (Season 2)",
    //     tags: &[],
    //     new: false,
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x080000000000103D",
    //     image: "antarctic_peninsula.jpg",
    //     name: "Antarctic Peninsula",
    //     description: "Antarctic Peninsula Release (Season 3)",
    //     tags: vec!["No Hero"],
    // },
    // Background {
    //     id: "0x0800000000001003",
    //     image: "kiriko_amaterasu.jpg",
    //     name: "Amaterasu Kiriko",
    //     description: "Season 3 Mythic Skin",
    //     tags: vec![],
    // },
    // Background {
    //     id: "0x0800000000001045",
    //     image: "kiriko_amaterasu_art.jpg",
    //     name: "Amaterasu Kiriko Variations",
    //     description: "Season 3 Mythic Skin",
    //     tags: vec!["Art"],
    // },
    Background {
        id: "0x0800000000000B6B",
        image: "cupid_hanzo.jpg",
        name: "Cupid Hanzo",
        description: "Ultimate Valentine 2023 (Season 3)",
        tags: &["Animated"],
        new: false,
    },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000000EED",
    //     image: "one_punch_man_doomfist.jpg",
    //     name: "Saitama Doomfist",
    //     description: "One Punch Man Event (Season 3)",
    //     tags: vec!["Collaboration", "No Music"],
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000001060",
    //     image: "lifeweaver.jpg",
    //     name: "Lifeweaver",
    //     description: "Lifeweaver Release (Season 4)",
    //     tags: vec![],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001032",
    //     image: "galactic_emperor_sigma.jpg",
    //     name: "Galactic Emperor Sigma",
    //     description: "Sigma Mythic Skin (Season 4)",
    //     tags: &["Mythic Skin"],
    //     new: false,
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000001132",
    //     image: "starwatch_art.jpg",
    //     name: "Starwatch",
    //     description: "Starwatch Event (Season 4)",
    //     tags: vec!["Art"],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001026",
    //     image: "zero_hour_owl.jpg",
    //     name: "Overwatch League Zero Hour",
    //     description: "Overwatch League Promo (Season 4)",
    //     tags: &["Overwatch League"],
    //     new: false,
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000001133",
    //     image: "questwatch_art.jpg",
    //     name: "Questwatch",
    //     description: "Questwatch Event (Season 5)",
    //     tags: vec!["Art"],
    // },
    Background {
        id: "0x0800000000000BCE",
        image: "summer_games_2023.jpg",
        name: "Tropical Doomfist",
        description: "Summer Games 2023 (Season 5)",
        tags: &[],
        new: false,
    },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x080000000000112B",
    //     image: "illari.jpg",
    //     name: "Illari",
    //     description: "Illari Release (Season 6)",
    //     tags: vec![],
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x08000000000010F2",
    //     image: "ana_a_7000_wargod.jpg",
    //     name: "A-7000 Wargod Ana",
    //     description: "Season 6 Mythic Skin",
    //     tags: vec![],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001104",
    //     image: "gothenburg_mothership.jpg",
    //     name: "Gothenburg Mothership",
    //     description: "Invasion PvE Event (Season 6)",
    //     tags: &["No Music"],
    //     new: false,
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000001150",
    //     image: "onryo_hanzo.jpg",
    //     name: "Onryo Hanzo",
    //     description: "Season 7 Mythic Skin",
    //     tags: vec![],
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x08000000000010AC",
    //     image: "onryo_hanzo_art.jpg",
    //     name: "Onryo Hanzo Art",
    //     description: "Season 7 Mythic Skin",
    //     tags: vec!["Art"],
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x080000000000115C",
    //     image: "lilith_moira.jpg",
    //     name: "Lilith Moira",
    //     description: "Halloween Terror 2023 (Season 7)",
    //     tags: vec![],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000000817",
    //     image: "overwatch_world_cup.jpg",
    //     name: "Overwatch World Cup",
    //     description: "Overwatch World Cup 2023 (Season 7)",
    //     tags: &["World Cup"],
    //     new: false,
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000001173",
    //     image: "le_sserafim_collab.jpg",
    //     name: "LE SSERAFIM",
    //     description: "LE SSERAFIM Event (Season 7)",
    //     tags: &["Collaboration", "Song: Perfect Night by LE SSERAFIM"],
    //     new: false,
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x080000000000118A",
    //     image: "mauga.jpg",
    //     name: "Mauga",
    //     description: "Mauga Release (Season 8)",
    //     tags: vec![],
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x0800000000001197",
    //     image: "grand_beast_orisa.jpg",
    //     name: "Grand Beast Orisa",
    //     description: "Season 8 Mythic Skin",
    //     tags: vec![],
    // },
    // NOTE: Removed in Season 9 rebase
    // Background {
    //     id: "0x08000000000011B4",
    //     image: "winter_wonderland_2023.jpg",
    //     name: "Festive Mercy, B.O.B. and Genji",
    //     description: "Winter Wonderland 2023 (Season 8)",
    //     tags: vec!["Art"],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001200",
    //     image: "ancient_caller_moira.jpg",
    //     name: "Ancient Caller Moira",
    //     description: "Moira Mythic Skin (Season 9)",
    //     tags: &["Mythic Skin", "Art"],
    //     new: false,
    // },
    Background {
        id: "0x0800000000001202",
        image: "cowboby_bebop.jpg",
        name: "Cowboy Bebop",
        description: "Cowboy Bebop Event (Season 9)",
        tags: &["Collaboration", "Art"],
        new: false,
    },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x080000000000121A",
    //     image: "venture.jpg",
    //     name: "Venture",
    //     description: "Venture Release (Season 10)",
    //     tags: &["Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x080000000000121E",
    //     image: "mirrorwatch.jpg",
    //     name: "Mirrorwatch",
    //     description: "Mirrorwatch Event (Season 10)",
    //     tags: &[],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000010AC",
    //     image: "mirrorwatch_art.jpg",
    //     name: "Mirrorwatch Art",
    //     description: "Mirrorwatch Event (Season 10)",
    //     tags: &["Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001219",
    //     image: "porsche.jpg",
    //     name: "Porsche D.Va",
    //     description: "Porsche Event (Season 10)",
    //     tags: &["Collaboration", "Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 12 (wasn't released on OverBuddy)
    // Background {
    //     id: "0x080000000000123F",
    //     image: "calamity_empress_ashe.jpg",
    //     name: "Calamity Empress Ashe",
    //     description: "Season 11 Mythic Skin",
    //     tags: &["Art"],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000008BA",
    //     image: "rose_gold_mercy.jpg",
    //     name: "Rose Gold Mercy",
    //     description: "Breast Cancer Charity Event (Season 11)",
    //     tags: &["Charity"],
    //     new: false,
    // },
    // NOTE: Removed in Season 12 (wasn't released on OverBuddy)
    // Background {
    //     id: "0x0800000000001243",
    //     image: "transformers.jpg",
    //     name: "Optimus Prime Reinhardt",
    //     description: "Transformers Event (Season 11)",
    //     tags: &["Collaboration", "Art"],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001249",
    //     image: "summer_games_2024.jpg",
    //     name: "Lifeguard Lifeweaver & Kiriko",
    //     description: "Summer Games 2024 (Season 11)",
    //     tags: &[],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x080000000000124A",
    //     image: "reinhardt_bound_demon_mythic.jpg",
    //     name: "Reinhardt Bound Demon",
    //     description: "Reinhardt Mythic Weapon (Season 11)",
    //     tags: &["Mythic Weapon"],
    //     new: false,
    // },
    // NOTE: Removed in Season 13
    // Background {
    //     id: "0x0800000000001276",
    //     image: "juno.jpg",
    //     name: "Juno",
    //     description: "Juno Release (Season 12)",
    //     tags: &["Art"],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001277",
    //     image: "anubis_reaper.jpg",
    //     name: "Anubis Reaper",
    //     description: "Reaper Mythic Skin (Season 12)",
    //     tags: &["Mythic Skin", "Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001293",
    //     image: "world_of_warcraft.jpg",
    //     name: "Sylvanas Widowmaker",
    //     description: "World of Warcraft Event (Season 12)",
    //     tags: &["Collaboration", "Art"],
    //     new: false,
    // },
    Background {
        id: "0x0800000000001289",
        image: "ana_midnight_sun_mythic.jpg",
        name: "Ana Mythic Weapon",
        description: "Midnight Sun Ana Mythic Weapon (Season 12)",
        tags: &["Mythic Weapon"],
        new: false,
    },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012A5",
    //     image: "spellbinder_widowmaker.jpg",
    //     name: "Spellbinder Widowmaker",
    //     description: "Widowmaker Mythic Skin (Season 13)",
    //     tags: &["Mythic Skin", "Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012A3",
    //     image: "owcs_finals_2024.jpg",
    //     name: "OWCS Finals 2024",
    //     description: "Overwatch Championship Series Finals 2024",
    //     tags: &["Overwatch Champions Series", "Art", "Crowd Sounds"],
    //     new: false,
    // },
    // NOTE: Removed in Season 14
    // Background {
    //     id: "0x08000000000012A4",
    //     image: "my_hero_academia.jpg",
    //     name: "My Hero Academia",
    //     description: "My Hero Academia Event (Season 13)",
    //     tags: &["Collaboration", "Art"],
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012C2",
    //     image: "overwatch_classic.jpg",
    //     name: "Overwatch Classic",
    //     description: "Overwatch Classic Event (Season 13)",
    //     tags: &["Overwatch 1.0 Patch", "Original Theme Song"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012BE",
    //     image: "soldier_76_deliverance.jpg",
    //     name: "Soldier: 76 Deliverance",
    //     description: "Soldier: 76 Mythic Weapon (Season 13)",
    //     tags: &["Mythic Weapon"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012C6",
    //     image: "hazard.jpg",
    //     name: "Hazard",
    //     description: "Hazard Release (Season 14)",
    //     tags: &["Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 15
    // Background {
    //     id: "0x08000000000012C7",
    //     image: "thor_reinhardt.jpg",
    //     name: "Thor Reinhardt",
    //     description: "Season 14 Mythic Skin",
    //     tags: &["Animated Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012EA",
    //     image: "welcome_home_china.jpg",
    //     name: "Welcome Home, China",
    //     description: "Chinese (NetEase) beta re-release of Overwatch (Season 14)",
    //     tags: &["Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012CA",
    //     image: "avatar_the_last_airbender.jpg",
    //     name: "Avatar: The Last Airbender",
    //     description: "Avatar: The Last Airbender Event (Season 14)",
    //     tags: &["Collaboration", "Animated Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x08000000000012CB",
    //     image: "ashe_lead_rose.jpg",
    //     name: "Ashe Lead Rose",
    //     description: "Ashe Mythic Weapon (Season 14)",
    //     tags: &["Mythic Weapon"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001300",
    //     image: "celestial_skins.jpg",
    //     name: "Celestial Skins",
    //     description: "Celestial Skin Bundle (Season 14)",
    //     tags: &[],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001316",
    //     image: "honor_and_glory.jpg",
    //     name: "Honor and Glory",
    //     description: "Season 15 Release Art",
    //     tags: &["Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001317",
    //     image: "party_in_china.jpg",
    //     name: "Party in China",
    //     description: "Chinese (NetEase) re-release of Overwatch (Season 15)",
    //     tags: &["Animated Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001331",
    //     image: "le_sserafim_homecoming.jpg",
    //     name: "LE SSERAFIM",
    //     description: "LE SSERAFIM Homecoming Event (Season 15)",
    //     tags: &[
    //         "Collaboration",
    //         "Art",
    //         "Song: So Cynical (Badum) by LE SSERAFIM",
    //     ],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x080000000000132D",
    //     image: "widowmaker_dame_chance.jpg",
    //     name: "Widowmaker Dame Chance",
    //     description: "Widowmaker Mythic Weapon (Season 15)",
    //     tags: &["Mythic Weapon"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x080000000000132F",
    //     image: "owcs_juno.jpg",
    //     name: "Ember Juno",
    //     description: "2025 Champions Clash Hangzhou Crowdfunding Skin",
    //     tags: &["Overwatch Champions Series"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001346",
    //     image: "stadium.jpg",
    //     name: "Stadium",
    //     description: "Stadium Release (Season 16)",
    //     tags: &["Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001347",
    //     image: "freja.jpg",
    //     name: "Freja",
    //     description: "Freja Release (Season 16)",
    //     tags: &["Animated Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001348",
    //     image: "gundam_wing.jpg",
    //     name: "Gundam Wing",
    //     description: "Gundam Wing Event (Season 16)",
    //     tags: &["Collaboration", "Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001353",
    //     image: "street_fighter_6.jpg",
    //     name: "Street Fighter 6",
    //     description: "Street Fighter 6 Event (Season 16)",
    //     tags: &["Collaboration", "Animated Art"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x080000000000134A",
    //     image: "mercy_merciful_magitech.jpg",
    //     name: "Mercy Merciful Magitech",
    //     description: "Mercy Mythic Weapon (Season 16)",
    //     tags: &["Mythic Weapon"],
    //     new: false,
    // },
    // NOTE: Removed in Season 17 rebase
    // Background {
    //     id: "0x0800000000001345",
    //     image: "heart_of_hope_juno.jpg",
    //     name: "Heart of Hope Juno",
    //     description: "Juno Mythic Skin (Season 16)",
    //     tags: &["Mythic Skin", "Animated Art"],
    //     new: false,
    // },
    Background {
        id: "0x0800000000001378",
        image: "reaper_steel_death.jpg",
        name: "Reaper Mythic Weapon",
        description: "Steel Death Reaper Mythic Weapon (Season 17)",
        tags: &["Mythic Weapon", "Art"],
        new: false,
    },
    Background {
        id: "0x0800000000001379",
        image: "gi_joe.jpg",
        name: "G.I. Joe",
        description: "G.I. Joe Event (Season 17)",
        tags: &["Collaboration", "Art"],
        new: false,
    },
    Background {
        id: "0x080000000000138A",
        image: "radiant_angel.jpg",
        name: "Radiant Angel Mercy",
        description: "OWCS 2025 Midseason Championship Crowdfunding Skin",
        tags: &["Overwatch Champions Series"],
        new: false,
    },
    Background {
        id: "0x0800000000001389",
        image: "nerf.jpg",
        name: "NERF",
        description: "NERF Collaboration Event (Season 17)",
        tags: &["Collaboration", "Art"],
        new: false,
    },
    Background {
        id: "0x080000000000139D",
        image: "wuyang.jpg",
        name: "Wuyang",
        description: "Wuyang Release (Season 18)",
        tags: &["Art"],
        new: true,
    },
    Background {
        id: "0x080000000000139F",
        image: "ultraviolet_sentinel_blazing_sunsetter.jpg",
        name: "Season 18 Mythics",
        description: "Ultraviolet Sentinel and Blazing Sunsetter (Season 18)",
        tags: &["Mythic Skin", "Mythic Weapon"],
        new: true,
    },
    Background {
        id: "0x08000000000013A2",
        image: "ultraviolet_sentinel_blazing_sunsetter_art.jpg",
        name: "Season 18 Mythic Art",
        description: "Ultraviolet Sentinel and Blazing Sunsetter (Season 18)",
        tags: &["Mythic Skin", "Mythic Weapon", "Art"],
        new: true,
    },
];

pub fn get_backgrounds() -> &'static [Background] {
    BACKGROUNDS
}

pub fn find_background_by_id(id: &str) -> Option<&'static Background> {
    BACKGROUNDS.iter().find(|&bg| bg.id == id)
}
