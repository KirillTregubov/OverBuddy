use serde::Serialize;

#[derive(Serialize)]
pub struct Background {
    pub id: &'static str,
    pub image: &'static str,
    pub name: &'static str,
}

pub fn get_backgrounds() -> Vec<Background> {
    vec![
        Background {
            id: "0x0800000000000E77",
            image: "heroes.jpg",
            name: "Heroes",
        },
        Background {
            id: "0x0800000000000EFB",
            image: "zero_hour.jpg",
            name: "Zero Hour",
        },
        Background {
            id: "0x0800000000000D6C",
            image: "sojourn.jpg",
            name: "Sojourn",
        },
        Background {
            id: "0x0800000000000EF3",
            image: "kiriko.jpg",
            name: "Kiriko",
        },
        Background {
            id: "0x0800000000000F4A",
            image: "zeus_junker_queen.jpg",
            name: "Zeus Junker Queen",
        },
        Background {
            id: "0x0800000000000F8F",
            image: "ramattra.jpg",
            name: "Ramattra",
        },
        Background {
            id: "0x0800000000000f31",
            image: "shambali_monastery.jpg",
            name: "Shambali Monastery",
        },
        Background {
            id: "0x0800000000000D77",
            image: "winter_wonderland_2022.jpg",
            name: "Winter Wonderland 2022",
        },
        Background {
            id: "0x0800000000000DAD",
            image: "lunar_new_year_2023.jpg",
            name: "Lunar New Year 2023",
        },
        Background {
            id: "0x0800000000001003",
            image: "kiriko_amaterasu.jpg",
            name: "Kiriko Amaterasu",
        },
        Background {
            id: "0x0800000000001045",
            image: "kiriko_amaterasu_art.jpg",
            name: "Kiriko Amaterasu Art",
        },
        Background {
            id: "0x080000000000103D",
            image: "antarctic_peninsula.jpg",
            name: "Antarctic Peninsula",
        },
        Background {
            id: "0x0800000000000B6B",
            image: "cupid_hanzo.jpg",
            name: "Cupid Hanzo",
        },
        Background {
            id: "0x0800000000000EED",
            image: "one_punch_man_doomfist.jpg",
            name: "One Punch Man Doomfist",
        },
        Background {
            id: "0x0800000000001060",
            image: "lifeweaver.jpg",
            name: "Lifeweaver",
        },
        Background {
            id: "0x0800000000001032",
            image: "galactic_emperor_sigma.jpg",
            name: "Galactic Emperor Sigma",
        },
        Background {
            id: "0x0800000000001132",
            image: "starwatch_art.jpg",
            name: "Starwatch Art",
        },
        Background {
            id: "0x0800000000001133",
            image: "questwatch_art.jpg",
            name: "Questwatch Art",
        },
        Background {
            id: "0x0800000000000BCE",
            image: "summer_games_2023.jpg",
            name: "Summer Games 2023",
        },
        Background {
            id: "0x080000000000112B",
            image: "illari.jpg",
            name: "Illari",
        },
        Background {
            id: "0x0800000000001104",
            image: "gothenburg_mothership.jpg",
            name: "Gothenburg Mothership",
        },
        Background {
            id: "0x08000000000010F2",
            image: "ana_a_7000_wargod.jpg",
            name: "Ana A-7000 Wargod",
        },
        Background {
            id: "0x0800000000001150",
            image: "onryo_hanzo.jpg",
            name: "Onryo Hanzo",
        },
        Background {
            id: "0x08000000000010AC",
            image: "onryo_hanzo_art.jpg",
            name: "Onryo Hanzo Art",
        },
        Background {
            id: "0x080000000000115C",
            image: "lilith_moira.jpg",
            name: "Lilith Moira",
        },
        Background {
            id: "0x0800000000000817",
            image: "overwatch_world_cup.jpg",
            name: "Overwatch World Cup",
        },
        Background {
            id: "0x0800000000000710",
            image: "d_va_lunar_busan.jpg",
            name: "D.VA (Lunar Busan)",
        },
        Background {
            id: "0x0800000000000864",
            image: "overwatch_league.jpg",
            name: "Overwatch League",
        },
        Background {
            id: "0x0800000000001173",
            image: "le_sserafim_collab.jpg",
            name: "LE SSERAFIM Collab",
        },
        Background {
            id: "0x080000000000118a",
            image: "mauga.jpg",
            name: "Mauga",
        },
        Background {
            id: "0x0800000000001197",
            image: "grand_beast_orisa.jpg",
            name: "Grand Beast Orisa",
        },
        Background {
            id: "0x08000000000011b4",
            image: "winter_wonderland_2023.jpg",
            name: "Winter Wonderland 2023",
        },
    ]
}
