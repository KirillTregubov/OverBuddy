use crate::config::SteamProfile;

pub fn extract_user_info(
    contents: &str,
    outer_key: &str,
    middle_key: &str,
    id: &str,
) -> Option<SteamProfile> {
    contents
        .find(&format!("\"{}\"", outer_key))
        .and_then(|outer_start| {
            contents[outer_start..]
                .find(&format!("\"{}\"", middle_key))
                .and_then(|middle_start| {
                    contents[outer_start + middle_start..]
                        .find(&format!("\"{}\"", id))
                        .and_then(|id_start| {
                            let object_start = outer_start + middle_start + id_start;
                            contents[object_start..]
                                .find('{')
                                .and_then(|open_brace_index| {
                                    let object_start = object_start + open_brace_index;
                                    let mut open_braces = 1;
                                    let mut in_quotes = false;

                                    for (i, c) in contents[object_start + 1..].chars().enumerate() {
                                        match c {
                                            '{' if !in_quotes => open_braces += 1,
                                            '}' if !in_quotes => {
                                                open_braces -= 1;
                                                if open_braces == 0 {
                                                    let end_index = object_start + i + 2;
                                                    let object_str =
                                                        &contents[object_start..end_index];
                                                    return Some(parse_user_info(object_str, id));
                                                }
                                            }
                                            '"' => in_quotes = !in_quotes,
                                            _ => {}
                                        }
                                    }
                                    None
                                })
                        })
                })
        })
}

fn parse_user_info(object_str: &str, id: &str) -> SteamProfile {
    let avatar = extract_value(object_str, "avatar");
    let name = extract_value(object_str, "name");
    SteamProfile {
        avatar,
        name,
        id: Some(id.to_string()),
    }
}

fn extract_value(object_str: &str, key: &str) -> Option<String> {
    if let Some(start) = object_str.find(&format!("\"{}\"", key)) {
        let key_start = start + key.len() + 3; // Skip the key, quotes, and tab
        if let Some(value_start) = object_str[key_start..].find('"') {
            let value_start = key_start + value_start + 1; // Move past the initial quote
            if let Some(value_end) = object_str[value_start..].find('"') {
                return Some(object_str[value_start..value_start + value_end].to_string());
            }
        }
    }
    None
}
