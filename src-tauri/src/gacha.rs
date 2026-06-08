use serde::{Deserialize, Serialize};
use tauri_plugin_http::reqwest;

const API_URL: &str = "https://gmserver-api.aki-game2.com/gacha/record/query";

const POOL_NAMES: [&str; 10] = [
    "角色活动唤取",
    "武器活动唤取",
    "角色常驻唤取",
    "武器常驻唤取",
    "新手唤取",
    "新手自选唤取",
    "角色新旅唤取",
    "武器新旅唤取",
    "武器联动唤取",
    "角色联动唤取",
];

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GachaRecord {
    #[serde(rename = "cardPoolType")]
    pub card_pool_type: String,
    #[serde(rename = "resourceId")]
    pub resource_id: i64,
    #[serde(rename = "qualityLevel")]
    pub quality_level: i32,
    #[serde(rename = "resourceType")]
    pub resource_type: String,
    pub name: String,
    pub count: i32,
    pub time: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiResponse {
    pub code: i32,
    pub message: String,
    pub data: Option<Vec<GachaRecord>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PoolApiResponse {
    pub pool_type: u8,
    pub pool_name: String,
    pub records: Vec<GachaRecord>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn fetch_gacha_data(
    player_id: String,
    server_id: String,
    card_pool_id: String,
    record_id: String,
    pool_types: Vec<u8>,
) -> Result<Vec<PoolApiResponse>, String> {
    let mut results = Vec::new();

    for &pool_type in &pool_types {
        if pool_type < 1 || pool_type > 10 {
            continue;
        }

        let pool_name = POOL_NAMES[(pool_type - 1) as usize].to_string();

        let payload = serde_json::json!({
            "playerId": player_id,
            "cardPoolId": card_pool_id,
            "cardPoolType": pool_type,
            "serverId": server_id,
            "languageCode": "zh-Hans",
            "recordId": record_id,
        });

        match reqwest::Client::new()
            .post(API_URL)
            .header("accept", "application/json, text/plain, */*")
            .header("accept-encoding", "gzip, deflate, br, zstd")
            .header("accept-language", "zh-Hans")
            .header("content-type", "application/json")
            .header("origin", "https://aki-gm-resources.aki-game.com")
            .header("referer", "https://aki-gm-resources.aki-game.com/")
            .header(
                "sec-ch-ua",
                "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
            )
            .header("sec-ch-ua-mobile", "?0")
            .header("sec-ch-ua-platform", "\"Windows\"")
            .header(
                "user-agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            )
            .body(serde_json::to_string(&payload).unwrap_or_default())
            .send()
            .await
        {
            Ok(resp) => {
                let status = resp.status();
                eprintln!(
                    "[gacha] pool_type={} ({}) HTTP {}",
                    pool_type, pool_name, status
                );

                if !status.is_success() {
                    results.push(PoolApiResponse {
                        pool_type,
                        pool_name,
                        records: vec![],
                        error: Some(format!("HTTP {}", status.as_u16())),
                    });
                    continue;
                }

                match resp.text().await {
                    Ok(body) => {
                        eprintln!(
                            "[gacha] pool_type={} body_len={}",
                            pool_type,
                            body.len()
                        );
                        match serde_json::from_str::<ApiResponse>(&body) {
                            Ok(api_resp) => {
                                let record_count = api_resp.data.as_ref().map_or(0, |v| v.len());
                                eprintln!(
                                    "[gacha] pool_type={} code={} msg={} records={}",
                                    pool_type, api_resp.code, api_resp.message, record_count
                                );
                                if api_resp.code == 0 {
                                    results.push(PoolApiResponse {
                                        pool_type,
                                        pool_name,
                                        records: api_resp.data.unwrap_or_default(),
                                        error: None,
                                    });
                                } else {
                                    results.push(PoolApiResponse {
                                        pool_type,
                                        pool_name,
                                        records: vec![],
                                        error: Some(format!(
                                            "API error code {}: {}",
                                            api_resp.code, api_resp.message
                                        )),
                                    });
                                }
                            }
                            Err(e) => {
                                eprintln!("[gacha] pool_type={} parse error: {}", pool_type, e);
                                results.push(PoolApiResponse {
                                    pool_type,
                                    pool_name,
                                    records: vec![],
                                    error: Some(format!("Parse error: {}", e)),
                                });
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("[gacha] pool_type={} read body error: {}", pool_type, e);
                        results.push(PoolApiResponse {
                            pool_type,
                            pool_name,
                            records: vec![],
                            error: Some(format!("Read body error: {}", e)),
                        });
                    }
                }
            }
            Err(e) => {
                results.push(PoolApiResponse {
                    pool_type,
                    pool_name,
                    records: vec![],
                    error: Some(format!("Request error: {}", e)),
                });
            }
        }
    }

    Ok(results)
}
