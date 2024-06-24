use serde::Serialize;

#[derive(Serialize)]
pub struct Background {
    pub id: &'static str,
    pub image: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub tags: &'static [&'static str],
}

const BACKGROUNDS: &[Background] = &[
    Background {
        id: "0x0800000000000864",
        image: "overwatch_league.jpg",
        name: "Overwatch League",
        description: "Overwatch League Promo",
        tags: &["Silent"],
    },
    Background {
        id: "0x0800000000000E77",
        image: "heroes.jpg",
        name: "Heroes",
        description: "2022 Alpha Test",
        tags: &[],
    },
    Background {
        id: "0x0800000000000D6C",
        image: "sojourn.jpg",
        name: "Sojourn",
        description: "2022 PvP Beta",
        tags: &[],
    },
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
    },
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
    },
    Background {
        id: "0x0800000000000DAD",
        image: "mei_lunar_2023.jpg",
        name: "Festive Mei",
        description: "Lunar New Year 2023 (Season 2)",
        tags: &[],
    },
    Background {
        id: "0x0800000000000710",
        image: "dva_lunar_2023.jpg",
        name: "Palanquin D.Va",
        description: "Lunar New Year 2023 (Season 2)",
        tags: &[],
    },
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
        tags: &[],
    },
    // Background {
    //     id: "0x0800000000000EED",
    //     image: "one_punch_man_doomfist.jpg",
    //     name: "Saitama Doomfist",
    //     description: "One Punch Man Event (Season 3)",
    //     tags: vec!["Collaboration", "No Music"],
    // },
    // Background {
    //     id: "0x0800000000001060",
    //     image: "lifeweaver.jpg",
    //     name: "Lifeweaver",
    //     description: "Lifeweaver Release (Season 4)",
    //     tags: vec![],
    // },
    Background {
        id: "0x0800000000001032",
        image: "galactic_emperor_sigma.jpg",
        name: "Galactic Emperor Sigma",
        description: "Season 4 Mythic Skin",
        tags: &[],
    },
    // Background {
    //     id: "0x0800000000001132",
    //     image: "starwatch_art.jpg",
    //     name: "Starwatch",
    //     description: "Starwatch Event (Season 4)",
    //     tags: vec!["Art"],
    // },
    Background {
        id: "0x0800000000001026",
        image: "zero_hour_owl.jpg",
        name: "Overwatch League Zero Hour",
        description: "Overwatch League Promo (Season 4)",
        tags: &["Esports"],
    },
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
    },
    // Background {
    //     id: "0x080000000000112B",
    //     image: "illari.jpg",
    //     name: "Illari",
    //     description: "Illari Release (Season 6)",
    //     tags: vec![],
    // },
    // Background {
    //     id: "0x08000000000010F2",
    //     image: "ana_a_7000_wargod.jpg",
    //     name: "A-7000 Wargod Ana",
    //     description: "Season 6 Mythic Skin",
    //     tags: vec![],
    // },
    Background {
        id: "0x0800000000001104",
        image: "gothenburg_mothership.jpg",
        name: "Gothenburg Mothership",
        description: "Invasion PvE Event (Season 6)",
        tags: &["No Music"],
    },
    // Background {
    //     id: "0x0800000000001150",
    //     image: "onryo_hanzo.jpg",
    //     name: "Onryo Hanzo",
    //     description: "Season 7 Mythic Skin",
    //     tags: vec![],
    // },
    // Background {
    //     id: "0x08000000000010AC",
    //     image: "onryo_hanzo_art.jpg",
    //     name: "Onryo Hanzo Art",
    //     description: "Season 7 Mythic Skin",
    //     tags: vec!["Art"],
    // },
    // Background {
    //     id: "0x080000000000115C",
    //     image: "lilith_moira.jpg",
    //     name: "Lilith Moira",
    //     description: "Halloween Terror 2023 (Season 7)",
    //     tags: vec![],
    // },
    Background {
        id: "0x0800000000000817",
        image: "overwatch_world_cup.jpg",
        name: "Overwatch World Cup",
        description: "Overwatch World Cup 2023 (Season 7)",
        tags: &["Esports"],
    },
    // Background {
    //     id: "0x0800000000001173",
    //     image: "le_sserafim_collab.jpg",
    //     name: "LE SSERAFIM",
    //     description: "LE SSERAFIM Event (Season 7)",
    //     tags: vec![
    //         "Collaboration",
    //         "Song: Perfect Night by LE SSERAFIM",
    //     ],
    // },
    // Background {
    //     id: "0x080000000000118a",
    //     image: "mauga.jpg",
    //     name: "Mauga",
    //     description: "Mauga Release (Season 8)",
    //     tags: vec![],
    // },
    // Background {
    //     id: "0x0800000000001197",
    //     image: "grand_beast_orisa.jpg",
    //     name: "Grand Beast Orisa",
    //     description: "Season 8 Mythic Skin",
    //     tags: vec![],
    // },
    // Background {
    //     id: "0x08000000000011b4",
    //     image: "winter_wonderland_2023.jpg",
    //     name: "Festive Mercy, B.O.B. and Genji",
    //     description: "Winter Wonderland 2023 (Season 8)",
    //     tags: vec!["Art"],
    // },
    Background {
        id: "0x0800000000001200",
        image: "ancient_caller_moira.jpg",
        name: "Ancient Caller Moira",
        description: "Season 9 Mythic Skin",
        tags: &["Art"],
    },
    Background {
        id: "0x080000000000121A",
        image: "venture.jpg",
        name: "Venture",
        description: "Venture Release (Season 10)",
        tags: &["Art"],
    },
    Background {
        id: "0x080000000000121E",
        image: "mirrorwatch.jpg",
        name: "Mirrorwatch",
        description: "Mirrorwatch Event (Season 10)",
        tags: &[],
    },
    Background {
        id: "0x08000000000010AC",
        image: "mirrorwatch_art.jpg",
        name: "Mirrorwatch Art",
        description: "Mirrorwatch Event (Season 10)",
        tags: &["Art"],
    },
    Background {
        id: "0x0800000000001219",
        image: "porsche.jpg",
        name: "Porsche D.Va",
        description: "Porsche Event (Season 10)",
        tags: &["Art"],
    },
    Background {
        id: "0x080000000000123F",
        image: "calamity_empress_ashe.jpg",
        name: "Calamity Empress Ashe",
        description: "Season 11 Mythic Skin",
        tags: &["Art"],
    },
];

// Map Codes found
// 0x0800000000000871 - Rialto
// 0x0800000000000807 - No Clue yet?

pub fn get_backgrounds() -> &'static [Background] {
    &BACKGROUNDS
}

pub fn find_background_by_id(id: &str) -> Option<&'static Background> {
    BACKGROUNDS.iter().find(|&bg| bg.id == id)
}
