// Generate presets translations for zh-Hant, ja, ko
const fs = require('fs');

const presets = {
  "zh-Hant": {
    title: "個性定製",
    subtitle: "一鍵模板，快速出圖——只需上傳或描述，剩下的交給我們",
    start_btn: "開始",
    generate_btn: "開始製作",
    upload_hint: "上傳照片",
    credit_multiplier: "[[COUNT]]倍積分",
    random_btn: "隨機抽卡",
    random_cost: "消耗 [[COUNT]] 積分",
    custom_prompt_priority: "自定義提示詞優先",
    free: "積分",
    ratio_1x1: "正方形 1:1", ratio_4x3: "標準 4:3", ratio_16x9: "寬屏 16:9", ratio_9x16: "豎屏 9:16",
    ratio_3x4: "豎版 3:4", ratio_2x3: "海報 2:3", ratio_3x2: "橫版 3:2", ratio_21x9: "超寬 21:9",
    photo_restoration: {
      name: "老照片修復", desc: "修復並增強老舊或破損的照片",
      params: { color: "顏色模式", color_color: "彩色", color_bw: "黑白", color_original: "原色調", resolution: "分辨率", resolution_original: "原尺寸", resolution_2x: "2倍提升", resolution_4x: "4倍提升", style: "輸出風格", style_fresh: "全新質感", style_vintage: "懷舊感", ratio: "圖片比例", custom: "自定義指令", custom_placeholder: "例如：讓天空更藍，移除左側的人..." }
    },
    cartoon_avatar: {
      name: "卡通頭像", desc: "將你的照片變成卡通/動漫風格頭像",
      params: { style: "藝術風格", style_3d: "3D皮克斯", style_chibi: "Q版", style_ghibli: "吉卜力", style_anime: "日系動漫", style_comic: "美式漫畫", style_manhwa: "韓系漫畫", style_cyberpunk: "賽博朋克", style_steampunk: "蒸汽朋克", style_pixel: "像素風", size: "頭像尺寸", size_head: "大頭照", size_bust: "半身照", size_full: "全身照", background: "背景", bg_keep: "保留原圖", bg_transparent: "透明背景", bg_custom: "自定義", bg_custom_label: "自定義背景", bg_custom_placeholder: "例如：海邊日落、城市天際線、純藍色...", gender: "性別風格", gender_keep: "根據原圖", gender_male: "偏男性", gender_female: "偏女性", age: "年齡", age_baby: "嬰兒", age_child: "小孩", age_teen: "少年", age_adult: "大人", ratio: "圖片比例", custom: "自定義指令", custom_placeholder: "例如：加眼鏡、頭髮更長、藍眼睛..." }
    },
    product_ad: {
      name: "產品廣告圖", desc: "製作專業的產品廣告宣傳海報",
      params: { title: "產品名稱", title_placeholder: "例如：無線降噪耳機 Pro", copy: "廣告文案", copy_placeholder: "例如：限時優惠，立即搶購！", points: "產品賣點", points_placeholder: "例如：48小時續航、主動降噪、IPX7防水...", ad_style: "視覺風格", style_tech: "科技感", style_warm: "溫馨感", style_luxury: "高級質感", style_minimal: "簡約風", style_natural: "自然清新", style_vibrant: "活力年輕", style_retro: "復古懷舊", style_industrial: "工業風", font_style: "字體風格", font_auto: "自動匹配", font_modern: "現代簡約", font_luxury: "高端襯線", font_bold: "粗體衝擊", font_handwriting: "手寫溫度", font_tech: "科技數字", font_cute: "圓潤可愛", ratio: "海報尺寸", ratio_custom: "自定義尺寸", custom_size: "自定義分辨率", custom_size_placeholder: "例如：800x1200px", event_time: "活動時間", event_time_placeholder: "例如：11月11日-15日", company: "企業名稱", company_placeholder: "例如：科技有限公司", contact: "聯繫人", contact_placeholder: "例如：張經理", phone: "聯繫電話", phone_placeholder: "例如：138-0000-0000", has_qrcode: "二維碼", qrcode_yes: "添加二維碼", qrcode_no: "不添加", recommend_copy: "AI推薦文案", ref_image: "風格參考圖", ref_image_hint: "上傳一張風格參考圖片", custom: "自定義指令", custom_placeholder: "例如：加倒計時、加價格標籤..." }
    },
    age_journey: {
      name: "年齡穿越", desc: "看看你從嬰兒到100歲的樣子",
      params: { age: "想要穿越的年齡（可多選合成穿越合照）", age_baby: "0歲", age_child: "6歲", age_teen: "16歲", age_adult: "25歲", age_40: "40歲", age_60: "60歲", age_80: "80歲", age_100: "100歲", background: "背景", bg_auto: "自動隨機", bg_studio: "影棚寫真", bg_nature: "戶外自然", bg_urban: "城市街景", bg_fantasy: "奇幻世界", bg_historical: "歷史時代", bg_scifi: "太空科幻", bg_beach: "海灘日落", source_age: "照片中人物的年齡", source_age_placeholder: "輸入具體年齡", framing: "照片身位", framing_head: "頭像照", framing_bust: "半身照", framing_full: "全身照", ratio: "圖片比例", custom: "自定義指令", custom_placeholder: "例如：保留我的笑容..." }
    },
    photo_together: {
      name: "來個合影", desc: "生成兩個人的合影——上傳照片或描述",
      params: { other_person: "和誰合影", other_person_placeholder: "例如：一位棕色頭髮戴眼鏡的男生...", pose: "動作姿勢", pose_standing: "並肩站立", pose_hugging: "擁抱", pose_holding_hands: "牽手", pose_back_to_back: "背靠背", pose_walking: "一起散步", pose_sitting: "並排坐著", pose_jumping: "一起跳躍", pose_shoulder_arm: "搭肩", background: "背景", bg_auto: "自動智能匹配", bg_park: "公園花園", bg_beach: "海灘", bg_city: "城市街道", bg_cafe: "咖啡廳", bg_mountain: "山景", bg_wedding_hall: "婚禮殿堂", bg_custom: "自定義地點", bg_custom_label: "自定義背景", bg_custom_placeholder: "例如：埃菲爾鐵塔前的日落...", ratio: "圖片比例", custom: "自定義指令", custom_placeholder: "例如：讓我們看起來像好朋友..." }
    },
    wallpaper: { name: "手機桌布", desc: "一鍵生成高清手機桌布", params: { style: "風格", style_nature: "自然風景", style_abstract: "抽象藝術", style_minimal: "極簡", style_space: "太空宇宙", style_geometric: "幾何圖形", style_gradient: "漸變色彩", color: "色調", color_auto: "自動匹配", color_dark: "深色系", color_light: "淺色系", color_vibrant: "鮮豔", color_pastel: "馬卡龍", mood: "氛圍", mood_calm: "寧靜", mood_energetic: "活力", mood_dreamy: "夢幻", ratio: "螢幕比例", ratio_tall: "全螢幕 9:19.5", custom: "自定義指令", custom_placeholder: "例如：加入星空元素..." } },
    logo_design: { name: "Logo 設計", desc: "AI 設計專業品牌 Logo", params: { brand: "品牌名稱", brand_placeholder: "例如：星辰科技", industry: "所屬行業", industry_placeholder: "例如：科技互聯網", style: "設計風格", style_minimal: "極簡", style_vintage: "復古", style_tech: "科技感", style_handdrawn: "手繪風", style_luxury: "高級感", style_geometric: "幾何", color: "主色調", color_auto: "自動匹配", color_dark: "深色系", color_gold: "金色", color_blue: "藍色", ratio: "比例", custom: "自定義指令", custom_placeholder: "例如：加入山脈元素..." } },
    tattoo_design: { name: "紋身設計", desc: "AI 紋身圖案設計", params: { theme: "紋身主題", theme_placeholder: "例如：玫瑰與蛇、龍、星座...", style: "紋身風格", style_traditional: "美式傳統", style_tribal: "部落圖騰", style_watercolor: "水彩風", style_minimalist: "極簡線條", style_japanese: "日式傳統", style_geometric: "幾何風", placement: "紋身部位", placement_arm: "手臂", placement_chest: "胸前", placement_back: "背部", placement_wrist: "手腕", placement_leg: "腿部", color: "顏色", color_bw: "黑白", color_color: "彩色", ratio: "比例", custom: "自定義指令", custom_placeholder: "例如：加藤蔓圍繞..." } },
    interior_design: { name: "室內設計", desc: "AI 室內設計概念效果圖", params: { room_type: "空間類型", room_living: "客廳", room_bedroom: "臥室", room_kitchen: "廚房", room_bathroom: "衛生間", room_office: "書房", style: "設計風格", style_modern: "現代簡約", style_minimalist: "極簡主義", style_industrial: "工業風", style_scandinavian: "北歐風", style_japandi: "日式侘寂", style_luxury: "輕奢", color: "色調", color_auto: "自動匹配", color_warm: "暖色調", color_cool: "冷色調", mood: "氛圍", mood_cozy: "溫馨舒適", mood_luxurious: "奢華精緻", mood_airy: "通透明亮", ratio: "比例", custom: "自定義指令", custom_placeholder: "例如：加入綠植、大落地窗..." } },
    food_design: { name: "美食攝影", desc: "AI 美食攝影大片", params: { dish: "菜品名稱", dish_placeholder: "例如：和牛牛排配黑松露", style: "拍攝風格", style_overhead: "俯拍", style_closeup: "微距特寫", style_rustic: "田園風", style_finedining: "高級餐廳", style_streetfood: "街頭美食", setting: "場景", setting_wooden: "木質桌面", setting_marble: "大理石台", setting_outdoor: "戶外自然光", setting_restaurant: "餐廳環境", ratio: "比例", custom: "自定義指令", custom_placeholder: "例如：加蒸汽效果..." } },
    package_design: { name: "包裝設計", desc: "AI 產品包裝設計方案", params: { product: "產品名稱", product_placeholder: "例如：有機蜂蜜", package_type: "包裝類型", type_box: "盒裝", type_bottle: "瓶裝", type_bag: "袋裝", type_tube: "管裝", type_jar: "罐裝", style: "設計風格", style_modern: "現代簡約", style_luxury: "高級質感", style_eco: "環保自然", style_vintage: "復古經典", style_minimal: "極簡主義", color: "主色調", color_auto: "自動匹配", color_dark: "深色系", color_light: "淺色系", ratio: "比例", custom: "自定義指令", custom_placeholder: "例如：加燙金工藝..." } },
    greeting_card: {
      name: "賀卡製作", desc: "為任何場合製作精美賀卡",
      params: {
        holiday: "節日/場合", holiday_birthday: "生日", holiday_christmas: "聖誕節", holiday_new_year: "新年", holiday_valentine: "情人節", holiday_mothers: "母親節", holiday_fathers: "父親節",
        holiday_halloween: "萬聖節", holiday_thanksgiving: "感恩節", holiday_wedding: "婚禮", holiday_graduation: "畢業", holiday_promotion: "升職", holiday_project: "項目殺青", holiday_general: "通用慶祝",
        from: "來自", from_placeholder: "例如：小明", to: "送給", to_placeholder: "例如：媽媽、老闆、最好的朋友...", message: "賀詞", message_placeholder: "寫下你的祝福...",
        style: "視覺風格", style_random: "隨機風格！", style_watercolor: "水彩手繪", style_flat: "扁平插畫", style_3D: "3D立體", style_chinese: "中國風", style_minimal: "極簡線條", style_retro: "復古懷舊",
        ratio: "方向", ratio_horizontal: "橫版 4:3", ratio_vertical: "豎版 3:4", custom: "自定義指令", custom_placeholder: "例如：加燙金效果、加花邊裝飾..."
      }
    }
  },
  "ja": {
    title: "クイックプリセット",
    subtitle: "ワンクリックテンプレートで簡単作成——アップロードまたは説明するだけ",
    start_btn: "開始",
    generate_btn: "生成",
    upload_hint: "写真をアップロード",
    credit_multiplier: "[[COUNT]]倍クレジット",
    random_btn: "ランダム",
    random_cost: "[[COUNT]] クレジット消費",
    custom_prompt_priority: "カスタムプロンプト優先",
    free: "クレジット",
    ratio_1x1: "正方形 1:1", ratio_4x3: "標準 4:3", ratio_16x9: "ワイド 16:9", ratio_9x16: "縦向き 9:16",
    ratio_3x4: "縦版 3:4", ratio_2x3: "ポスター 2:3", ratio_3x2: "横向き 3:2", ratio_21x9: "超ワイド 21:9",
    photo_restoration: {
      name: "古い写真の修復", desc: "古くなったり傷んだ写真を修復・強化します",
      params: { color: "カラーモード", color_color: "カラー", color_bw: "白黒", color_original: "元の色調", resolution: "解像度", resolution_original: "元のサイズ", resolution_2x: "2倍アップスケール", resolution_4x: "4倍アップスケール", style: "出力スタイル", style_fresh: "フレッシュ", style_vintage: "ビンテージ", ratio: "アスペクト比", custom: "カスタム指示", custom_placeholder: "例：空を青く、左側の人を削除..." }
    },
    cartoon_avatar: {
      name: "アニメアバター", desc: "写真をアニメ風アバターに変換",
      params: { style: "アートスタイル", style_3d: "3Dピクサー", style_chibi: "ちびキャラ", style_ghibli: "ジブリ", style_anime: "アニメ", style_comic: "コミック", style_manhwa: "韓国漫画", style_cyberpunk: "サイバーパンク", style_steampunk: "スチームパンク", style_pixel: "ピクセルアート", size: "ポートレートサイズ", size_head: "バストアップ", size_bust: "胸像", size_full: "全身", background: "背景", bg_keep: "元のまま", bg_transparent: "透明", bg_custom: "カスタム", bg_custom_label: "カスタム背景", bg_custom_placeholder: "例：ビーチの夕日、都市のスカイライン...", gender: "性別スタイル", gender_keep: "元のまま", gender_male: "男性寄り", gender_female: "女性寄り", age: "年齢", age_baby: "赤ちゃん", age_child: "子供", age_teen: "ティーン", age_adult: "大人", ratio: "アスペクト比", custom: "カスタム指示", custom_placeholder: "例：メガネを追加、髪を長く..." }
    },
    product_ad: {
      name: "商品広告", desc: "プロフェッショナルな商品広告ポスターを作成",
      params: { title: "商品名", title_placeholder: "例：ワイヤレスノイキャンヘッドホン Pro", copy: "広告コピー", copy_placeholder: "例：期間限定セール、今すぐ購入！", points: "セールスポイント", points_placeholder: "例：48時間バッテリー、アクティブノイズキャンセリング...", ad_style: "ビジュアルスタイル", style_tech: "テック", style_warm: "温かみ", style_luxury: "ラグジュアリー", style_minimal: "ミニマル", style_natural: "ナチュラル", style_vibrant: "ビビッド", style_retro: "レトロ", style_industrial: "インダストリアル", font_style: "フォント", font_auto: "自動", font_modern: "モダン", font_luxury: "高級セリフ", font_bold: "ボールド", font_handwriting: "手書き", font_tech: "テック", font_cute: "かわいい", ratio: "ポスターサイズ", ratio_custom: "カスタムサイズ", custom_size: "カスタム解像度", custom_size_placeholder: "例：800x1200px", event_time: "イベント期間", event_time_placeholder: "例：11月11日〜15日", company: "会社名", company_placeholder: "例：テック株式会社", contact: "担当者", contact_placeholder: "例：山田太郎", phone: "電話番号", phone_placeholder: "例：03-0000-0000", has_qrcode: "QRコード", qrcode_yes: "追加", qrcode_no: "なし", recommend_copy: "AIコピー提案", ref_image: "スタイル参考画像", ref_image_hint: "参考画像をアップロード", custom: "カスタム指示", custom_placeholder: "例：カウントダウンタイマーを追加..." }
    },
    age_journey: {
      name: "年齢変身", desc: "赤ちゃんから100歳までの姿を見てみよう",
      params: { age: "変身したい年齢（複数選択で集合写真）", age_baby: "0歳", age_child: "6歳", age_teen: "16歳", age_adult: "25歳", age_40: "40歳", age_60: "60歳", age_80: "80歳", age_100: "100歳", background: "背景", bg_auto: "自動", bg_studio: "スタジオ", bg_nature: "自然", bg_urban: "街中", bg_fantasy: "ファンタジー", bg_historical: "歴史時代", bg_scifi: "SF", bg_beach: "ビーチの夕日", source_age: "写真の人物の年齢", source_age_placeholder: "実際の年齢を入力", framing: "フレーミング", framing_head: "バストアップ", framing_bust: "胸像", framing_full: "全身", ratio: "アスペクト比", custom: "カスタム指示", custom_placeholder: "例：笑顔を保って..." }
    },
    photo_together: {
      name: "一緒に写真", desc: "二人の写真を作成——アップロードまたは説明",
      params: { other_person: "誰と撮るか", other_person_placeholder: "例：眼鏡をかけた茶髪の男性...", pose: "ポーズ", pose_standing: "並んで立つ", pose_hugging: "抱擁", pose_holding_hands: "手をつなぐ", pose_back_to_back: "背中合わせ", pose_walking: "一緒に歩く", pose_sitting: "並んで座る", pose_jumping: "一緒にジャンプ", pose_shoulder_arm: "肩に手を置く", background: "背景", bg_auto: "自動", bg_park: "公園", bg_beach: "ビーチ", bg_city: "街中", bg_cafe: "カフェ", bg_mountain: "山", bg_wedding_hall: "結婚式場", bg_custom: "カスタム", bg_custom_label: "カスタム背景", bg_custom_placeholder: "例：エッフェル塔の夕日...", ratio: "アスペクト比", custom: "カスタム指示", custom_placeholder: "例：親友のように見せて..." }
    },
    wallpaper: { name: "スマホ壁紙", desc: "高画質スマホ壁紙をワンクリック生成", params: { style: "スタイル", style_nature: "自然", style_abstract: "抽象", style_minimal: "ミニマル", style_space: "宇宙", style_geometric: "幾何学", style_gradient: "グラデーション", color: "色調", color_auto: "自動", color_dark: "ダーク", color_light: "ライト", color_vibrant: "ビビッド", color_pastel: "パステル", mood: "雰囲気", mood_calm: "穏やか", mood_energetic: "活力", mood_dreamy: "夢のような", ratio: "画面比率", ratio_tall: "フルスクリーン 9:19.5", custom: "カスタム指示", custom_placeholder: "例：星空要素を追加..." } },
    logo_design: { name: "ロゴデザイン", desc: "AI プロフェッショナルロゴデザイン", params: { brand: "ブランド名", brand_placeholder: "例：StellarTech", industry: "業界", industry_placeholder: "例：テック＆インターネット", style: "デザインスタイル", style_minimal: "ミニマル", style_vintage: "ビンテージ", style_tech: "テック", style_handdrawn: "手描き", style_luxury: "プレミアム", style_geometric: "幾何学", color: "メインカラー", color_auto: "自動", color_dark: "ダーク", color_gold: "ゴールド", color_blue: "ブルー", ratio: "比率", custom: "カスタム指示", custom_placeholder: "例：山の要素を含める..." } },
    tattoo_design: { name: "タトゥーデザイン", desc: "AI タトゥーパターンデザイン", params: { theme: "タトゥーテーマ", theme_placeholder: "例：バラと蛇、ドラゴン、星座...", style: "タトゥースタイル", style_traditional: "トラディショナル", style_tribal: "トライバル", style_watercolor: "水彩", style_minimalist: "ミニマリスト", style_japanese: "和彫り", style_geometric: "幾何学", placement: "部位", placement_arm: "腕", placement_chest: "胸", placement_back: "背中", placement_wrist: "手首", placement_leg: "脚", color: "色", color_bw: "白黒", color_color: "カラー", ratio: "比率", custom: "カスタム指示", custom_placeholder: "例：蔓を巻き付ける..." } },
    interior_design: { name: "インテリアデザイン", desc: "AI インテリアデザインコンセプト", params: { room_type: "部屋タイプ", room_living: "リビング", room_bedroom: "寝室", room_kitchen: "キッチン", room_bathroom: "バスルーム", room_office: "書斎", style: "デザインスタイル", style_modern: "モダン", style_minimalist: "ミニマリスト", style_industrial: "インダストリアル", style_scandinavian: "北欧", style_japandi: "ジャパンディ", style_luxury: "ラグジュアリー", color: "色調", color_auto: "自動", color_warm: "暖色", color_cool: "寒色", mood: "雰囲気", mood_cozy: "居心地良い", mood_luxurious: "豪華", mood_airy: "明るく開放感", ratio: "比率", custom: "カスタム指示", custom_placeholder: "例：観葉植物、大きな窓を追加..." } },
    food_design: { name: "料理写真", desc: "AI 料理写真の傑作", params: { dish: "料理名", dish_placeholder: "例：和牛ステーキ 黒トリュフ添え", style: "撮影スタイル", style_overhead: "真上から", style_closeup: "マクロ接写", style_rustic: "素朴", style_finedining: "高級料理", style_streetfood: "ストリートフード", setting: "シーン", setting_wooden: "木製テーブル", setting_marble: "大理石", setting_outdoor: "屋外自然光", setting_restaurant: "レストラン", ratio: "比率", custom: "カスタム指示", custom_placeholder: "例：湯気を追加..." } },
    package_design: { name: "パッケージデザイン", desc: "AI 商品パッケージデザイン", params: { product: "商品名", product_placeholder: "例：オーガニックハチミツ", package_type: "パッケージタイプ", type_box: "箱", type_bottle: "ボトル", type_bag: "袋", type_tube: "チューブ", type_jar: "瓶", style: "デザインスタイル", style_modern: "モダン", style_luxury: "プレミアム", style_eco: "エコ", style_vintage: "ビンテージ", style_minimal: "ミニマリスト", color: "メインカラー", color_auto: "自動", color_dark: "ダーク", color_light: "ライト", ratio: "比率", custom: "カスタム指示", custom_placeholder: "例：金箔押し加工を追加..." } },
    greeting_card: {
      name: "グリーティングカード", desc: "あらゆるシーンに美しいカードを作成",
      params: {
        holiday: "行事", holiday_birthday: "誕生日", holiday_christmas: "クリスマス", holiday_new_year: "新年", holiday_valentine: "バレンタイン", holiday_mothers: "母の日", holiday_fathers: "父の日",
        holiday_halloween: "ハロウィン", holiday_thanksgiving: "感謝祭", holiday_wedding: "結婚式", holiday_graduation: "卒業", holiday_promotion: "昇進", holiday_project: "プロジェクト完了", holiday_general: "一般",
        from: "送り主", from_placeholder: "例：太郎", to: "宛先", to_placeholder: "例：お母さん、上司、親友...", message: "メッセージ", message_placeholder: "メッセージを書いてください...",
        style: "ビジュアルスタイル", style_random: "ランダム！", style_watercolor: "水彩画", style_flat: "フラットイラスト", style_3D: "3Dレンダリング", style_chinese: "中国風", style_minimal: "ミニマル線画", style_retro: "レトロ",
        ratio: "向き", ratio_horizontal: "横 4:3", ratio_vertical: "縦 3:4", custom: "カスタム指示", custom_placeholder: "例：金箔効果、花の装飾を追加..."
      }
    }
  },
  "ko": {
    title: "빠른 프리셋",
    subtitle: "원클릭 템플릿으로 빠르게 제작 — 업로드하거나 설명만 하세요",
    start_btn: "시작",
    generate_btn: "생성",
    upload_hint: "사진 업로드",
    credit_multiplier: "[[COUNT]]배 크레딧",
    random_btn: "랜덤",
    random_cost: "[[COUNT]] 크레딧 소모",
    custom_prompt_priority: "사용자 정의 프롬프트 우선",
    free: "크레딧",
    ratio_1x1: "정사각형 1:1", ratio_4x3: "표준 4:3", ratio_16x9: "와이드 16:9", ratio_9x16: "세로 9:16",
    ratio_3x4: "세로 3:4", ratio_2x3: "포스터 2:3", ratio_3x2: "가로 3:2", ratio_21x9: "울트라와이드 21:9",
    photo_restoration: {
      name: "오래된 사진 복원", desc: "오래되거나 손상된 사진을 복원하고 개선합니다",
      params: { color: "색상 모드", color_color: "컬러", color_bw: "흑백", color_original: "원본 톤", resolution: "해상도", resolution_original: "원본 크기", resolution_2x: "2배 업스케일", resolution_4x: "4배 업스케일", style: "출력 스타일", style_fresh: "새로운 느낌", style_vintage: "빈티지", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 하늘을 더 파랗게, 왼쪽 사람 제거..." }
    },
    cartoon_avatar: {
      name: "만화 아바타", desc: "사진을 만화/애니메이션 아바타로 변환",
      params: { style: "아트 스타일", style_3d: "3D 픽사", style_chibi: "치비", style_ghibli: "지브리", style_anime: "애니메이션", style_comic: "코믹", style_manhwa: "한국 만화", style_cyberpunk: "사이버펑크", style_steampunk: "스팀펑크", style_pixel: "픽셀 아트", size: "초상화 크기", size_head: "얼굴 사진", size_bust: "반신", size_full: "전신", background: "배경", bg_keep: "원본 유지", bg_transparent: "투명", bg_custom: "사용자 정의", bg_custom_label: "사용자 정의 배경", bg_custom_placeholder: "예: 해변 석양, 도시 스카이라인...", gender: "성별 스타일", gender_keep: "원본 유지", gender_male: "남성적", gender_female: "여성적", age: "나이", age_baby: "아기", age_child: "어린이", age_teen: "청소년", age_adult: "성인", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 안경 추가, 긴 머리..." }
    },
    product_ad: {
      name: "제품 광고", desc: "전문적인 제품 광고 포스터 제작",
      params: { title: "제품명", title_placeholder: "예: 무선 노이즈 캔슬링 헤드폰 Pro", copy: "광고 카피", copy_placeholder: "예: 기간 한정 할인, 지금 구매하세요!", points: "판매 포인트", points_placeholder: "예: 48시간 배터리, 액티브 노이즈 캔슬링...", ad_style: "비주얼 스타일", style_tech: "테크", style_warm: "따뜻한", style_luxury: "럭셔리", style_minimal: "미니멀", style_natural: "자연", style_vibrant: "비비드", style_retro: "레트로", style_industrial: "인더스트리얼", font_style: "폰트", font_auto: "자동", font_modern: "모던", font_luxury: "고급 세리프", font_bold: "볼드", font_handwriting: "손글씨", font_tech: "테크", font_cute: "귀여운", ratio: "포스터 크기", ratio_custom: "사용자 정의 크기", custom_size: "사용자 정의 해상도", custom_size_placeholder: "예: 800x1200px", event_time: "이벤트 기간", event_time_placeholder: "예: 11월 11일-15일", company: "회사명", company_placeholder: "예: 테크 주식회사", contact: "담당자", contact_placeholder: "예: 홍길동", phone: "전화번호", phone_placeholder: "예: 010-0000-0000", has_qrcode: "QR코드", qrcode_yes: "추가", qrcode_no: "없음", recommend_copy: "AI 카피 추천", ref_image: "스타일 참고 이미지", ref_image_hint: "참고 이미지 업로드", custom: "사용자 정의", custom_placeholder: "예: 카운트다운 타이머 추가..." }
    },
    age_journey: {
      name: "나이 변신", desc: "아기부터 100세까지의 모습을 확인하세요",
      params: { age: "변신할 나이 (여러 개 선택 시 단체 사진)", age_baby: "0세", age_child: "6세", age_teen: "16세", age_adult: "25세", age_40: "40세", age_60: "60세", age_80: "80세", age_100: "100세", background: "배경", bg_auto: "자동", bg_studio: "스튜디오", bg_nature: "자연", bg_urban: "도시", bg_fantasy: "판타지", bg_historical: "역사 시대", bg_scifi: "SF", bg_beach: "해변 석양", source_age: "사진 속 인물의 나이", source_age_placeholder: "실제 나이 입력", framing: "프레이밍", framing_head: "얼굴", framing_bust: "반신", framing_full: "전신", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 미소 유지..." }
    },
    photo_together: {
      name: "함께 사진", desc: "두 사람의 사진 생성 — 업로드 또는 설명",
      params: { other_person: "누구와 함께", other_person_placeholder: "예: 안경 쓴 갈색 머리 남자...", pose: "포즈", pose_standing: "나란히 서기", pose_hugging: "포옹", pose_holding_hands: "손잡기", pose_back_to_back: "등 맞대기", pose_walking: "함께 걷기", pose_sitting: "나란히 앉기", pose_jumping: "함께 점프", pose_shoulder_arm: "어깨에 팔 두르기", background: "배경", bg_auto: "자동", bg_park: "공원", bg_beach: "해변", bg_city: "도시", bg_cafe: "카페", bg_mountain: "산", bg_wedding_hall: "웨딩홀", bg_custom: "사용자 정의", bg_custom_label: "사용자 정의 배경", bg_custom_placeholder: "예: 에펠탑 앞 석양...", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 친한 친구처럼 보이게..." }
    },
    wallpaper: { name: "휴대폰 배경화면", desc: "고화질 배경화면을 원클릭으로 생성", params: { style: "스타일", style_nature: "자연", style_abstract: "추상", style_minimal: "미니멀", style_space: "우주", style_geometric: "기하학", style_gradient: "그라데이션", color: "색조", color_auto: "자동", color_dark: "다크", color_light: "라이트", color_vibrant: "비비드", color_pastel: "파스텔", mood: "분위기", mood_calm: "평온", mood_energetic: "활기", mood_dreamy: "몽환적", ratio: "화면 비율", ratio_tall: "전체 화면 9:19.5", custom: "사용자 정의", custom_placeholder: "예: 별이 빛나는 하늘 요소 추가..." } },
    logo_design: { name: "로고 디자인", desc: "AI 전문 로고 디자인", params: { brand: "브랜드명", brand_placeholder: "예: StellarTech", industry: "업종", industry_placeholder: "예: 테크 & 인터넷", style: "디자인 스타일", style_minimal: "미니멀", style_vintage: "빈티지", style_tech: "테크", style_handdrawn: "손그림", style_luxury: "프리미엄", style_geometric: "기하학", color: "메인 컬러", color_auto: "자동", color_dark: "다크", color_gold: "골드", color_blue: "블루", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 산 요소 포함..." } },
    tattoo_design: { name: "문신 디자인", desc: "AI 문신 패턴 디자인", params: { theme: "문신 테마", theme_placeholder: "예: 장미와 뱀, 용, 별자리...", style: "문신 스타일", style_traditional: "전통", style_tribal: "트라이벌", style_watercolor: "수채화", style_minimalist: "미니멀리스트", style_japanese: "일본 전통", style_geometric: "기하학", placement: "위치", placement_arm: "팔", placement_chest: "가슴", placement_back: "등", placement_wrist: "손목", placement_leg: "다리", color: "색상", color_bw: "흑백", color_color: "컬러", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 덩굴 감기 추가..." } },
    interior_design: { name: "인테리어 디자인", desc: "AI 인테리어 디자인 컨셉 렌더링", params: { room_type: "공간 유형", room_living: "거실", room_bedroom: "침실", room_kitchen: "주방", room_bathroom: "욕실", room_office: "서재", style: "디자인 스타일", style_modern: "모던", style_minimalist: "미니멀리스트", style_industrial: "인더스트리얼", style_scandinavian: "북유럽", style_japandi: "자판디", style_luxury: "럭셔리", color: "색조", color_auto: "자동", color_warm: "따뜻한", color_cool: "차가운", mood: "분위기", mood_cozy: "아늑한", mood_luxurious: "고급스러운", mood_airy: "환한", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 식물, 큰 창문 추가..." } },
    food_design: { name: "음식 사진", desc: "AI 음식 사진 걸작", params: { dish: "요리명", dish_placeholder: "예: 와규 스테이크 with 블랙 트러플", style: "촬영 스타일", style_overhead: "탑뷰", style_closeup: "매크로 접사", style_rustic: "소박한", style_finedining: "고급 다이닝", style_streetfood: "길거리 음식", setting: "장소", setting_wooden: "나무 테이블", setting_marble: "대리석", setting_outdoor: "야외 자연광", setting_restaurant: "레스토랑", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 김이 나는 효과 추가..." } },
    package_design: { name: "패키지 디자인", desc: "AI 제품 패키지 디자인", params: { product: "제품명", product_placeholder: "예: 유기농 꿀", package_type: "패키지 유형", type_box: "상자", type_bottle: "병", type_bag: "봉투", type_tube: "튜브", type_jar: "단지", style: "디자인 스타일", style_modern: "모던", style_luxury: "프리미엄", style_eco: "친환경", style_vintage: "빈티지", style_minimal: "미니멀리스트", color: "메인 컬러", color_auto: "자동", color_dark: "다크", color_light: "라이트", ratio: "비율", custom: "사용자 정의", custom_placeholder: "예: 금박 스탬핑 추가..." } },
    greeting_card: {
      name: "인사말 카드", desc: "모든 행사를 위한 아름다운 카드 제작",
      params: {
        holiday: "행사", holiday_birthday: "생일", holiday_christmas: "크리스마스", holiday_new_year: "새해", holiday_valentine: "밸런타인데이", holiday_mothers: "어머니의 날", holiday_fathers: "아버지의 날",
        holiday_halloween: "할로윈", holiday_thanksgiving: "추수감사절", holiday_wedding: "결혼식", holiday_graduation: "졸업", holiday_promotion: "승진", holiday_project: "프로젝트 완료", holiday_general: "일반",
        from: "보내는 사람", from_placeholder: "예: 철수", to: "받는 사람", to_placeholder: "예: 엄마, 상사, 친한 친구...", message: "메시지", message_placeholder: "축하 메시지를 작성하세요...",
        style: "비주얼 스타일", style_random: "랜덤!", style_watercolor: "수채화", style_flat: "플랫 일러스트", style_3D: "3D 렌더링", style_chinese: "중국풍", style_minimal: "미니멀 라인", style_retro: "레트로",
        ratio: "방향", ratio_horizontal: "가로 4:3", ratio_vertical: "세로 3:4", custom: "사용자 정의", custom_placeholder: "예: 금박 효과, 꽃 장식 추가..."
      }
    }
  }
};

// Write to each locale file
for (const [locale, data] of Object.entries(presets)) {
  const path = `./messages/${locale}.json`;
  const j = JSON.parse(fs.readFileSync(path, 'utf8'));
  j.presets = data;
  fs.writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
  console.log(`${locale}: done (${Object.keys(data).length} root keys)`);
}
