"""
TRINETRA 100-Complaint Multilingual AI Validation Dataset Generator.
Generates exactly 100 realistic, synthetic Haryana complaints across 5 distinct linguistic styles:
1. 20 Conversational Haryanvi / Haryana dialect
2. 20 Hindi (Standard / Devanagari)
3. 20 Hinglish / Code-switching
4. 20 Informal / Typos / Abbreviations
5. 20 Vague / Short / Ambiguous descriptions

Also generates ground-truth labels for all 100 complaints and all 4,950 pairwise relationships
BEFORE testing the system.
"""
import json
import math
import sys
from pathlib import Path

OUT_DIR = Path(__file__).parent
sys.path.insert(0, str(OUT_DIR.parent.parent))

COMPLAINTS = [
    # =========================================================================
    # BATCH 1: CONVERSATIONAL HARYANVI (20 reports: CMP-001 to CMP-020)
    # =========================================================================
    {
        "id": "CMP-001",
        "title": "Gali mein paani khada se",
        "description": "Bhai Sector 14 ki gali no 3 mein pura paani khada se, ghotne tak paani aagya, nikalna mushkil ho rya se.",
        "language_category": "haryanvi",
        "latitude": 28.4720, "longitude": 77.0425,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_waterlog_sec14_a.jpg"
    },
    {
        "id": "CMP-002",
        "title": "Bhai naali jam se paani bahar aa rya hai",
        "description": "Bhai naali jam se, pura ganda paani sadak pe bahar aa rya se, badboo aave se bhari.",
        "language_category": "haryanvi",
        "latitude": 28.4722, "longitude": 77.0423,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_waterlog_sec14_b.jpg"
    },
    {
        "id": "CMP-003",
        "title": "Bijli ka khamba gir gaya",
        "description": "Sector 29 market ke samne bijli ka khamba gir gaya se bhai, taar sadak pe padya se koi current na lag jave kisi ne.",
        "language_category": "haryanvi",
        "latitude": 28.4680, "longitude": 77.0620,
        "district_id": "HR-GU", "locality": "Sector 29, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-POLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_pole_down_sec29.jpg"
    },
    {
        "id": "CMP-004",
        "title": "Taar toot ke latak rya hai",
        "description": "Main road pe taar toot ke latak rya hai bhai, sparking hori se dhuwan nikal rya h.",
        "language_category": "haryanvi",
        "latitude": 28.4682, "longitude": 77.0622,
        "district_id": "HR-GU", "locality": "Sector 29, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-POLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_live_wire_sec29.jpg"
    },
    {
        "id": "CMP-005",
        "title": "Bada khadda ho rya se sadak pe",
        "description": "IFFCO chowk ke paas sadak pe bohot bada khadda ho rya se, do motorcycle aale gir gaye kal sanjh ko.",
        "language_category": "haryanvi",
        "latitude": 28.4725, "longitude": 77.0725,
        "district_id": "HR-GU", "locality": "IFFCO Chowk, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-POTHOLE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_pothole_iffco_a.jpg"
    },
    {
        "id": "CMP-006",
        "title": "Kooda ka dher lag rya se",
        "description": "DLF Phase 3 gali no 8 mein kooda ka dher lag rya se bhai, 5 din te koye uthan na aaya, bimaari failegi.",
        "language_category": "haryanvi",
        "latitude": 28.4950, "longitude": 77.0900,
        "district_id": "HR-GU", "locality": "DLF Phase 3, Gurugram",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-GUR-GARBAGE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_garbage_dlf.jpg"
    },
    {
        "id": "CMP-007",
        "title": "Paani ki pipeline leak ho ri hai",
        "description": "Subhash Chowk dhore paani ki moti pipeline leak ho ri se, saara saaf paani behta ja rya se dharre pe.",
        "language_category": "haryanvi",
        "latitude": 28.4350, "longitude": 77.0410,
        "district_id": "HR-GU", "locality": "Subhash Chowk, Gurugram",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "INC-GUR-PIPE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_pipe_leak_subhash.jpg"
    },
    {
        "id": "CMP-008",
        "title": "Underpass mein paani bhar gya",
        "description": "Rajiv Chowk aale underpass mein gadiyan doob ri se bhai, paani ka koi nikas na se.",
        "language_category": "haryanvi",
        "latitude": 28.4550, "longitude": 77.0300,
        "district_id": "HR-GU", "locality": "Rajiv Chowk, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-UNDERPASS-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_underpass_water.jpg"
    },
    {
        "id": "CMP-009",
        "title": "Sewer ka dhakkan toota padya se",
        "description": "Old Railway Road pe sewer ka dhakkan toota padya se, andhere mein koi gir sake se.",
        "language_category": "haryanvi",
        "latitude": 28.4650, "longitude": 77.0200,
        "district_id": "HR-GU", "locality": "Old Railway Road, Gurugram",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-GUR-SEWER-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_open_manhole.jpg"
    },
    {
        "id": "CMP-010",
        "title": "Streetlight saari band padi se",
        "description": "Sohna road mod pe saari batiyan band padi se bhai, andhera ghanghor se chori ka darr se.",
        "language_category": "haryanvi",
        "latitude": 28.4100, "longitude": 77.0400,
        "district_id": "HR-GU", "locality": "Sohna Road, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-LIGHT-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_dark_street.jpg"
    },
    {
        "id": "CMP-011",
        "title": "Badshahpur naala ufan pe se",
        "description": "Badshahpur naala pura bhar ke ufan rya se, kinare toot gaye to basti doob javegi.",
        "language_category": "haryanvi",
        "latitude": 28.4020, "longitude": 77.0510,
        "district_id": "HR-GU", "locality": "Badshahpur, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-DRAIN-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_drain_overflow.jpg"
    },
    {
        "id": "CMP-012",
        "title": "Sewerage ka ganda paani gali me",
        "description": "Rohtak Sheela Bypass dhore sewer ubal rya se, badboo ke maare rehna dushwar se bhai.",
        "language_category": "haryanvi",
        "latitude": 28.8950, "longitude": 76.6060,
        "district_id": "HR-RO", "locality": "Sheela Bypass, Rohtak",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-ROH-SEWER-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_rohtak_sewer.jpg"
    },
    {
        "id": "CMP-013",
        "title": "Ped gir gaya sadak ke beech",
        "description": "Andhi aayi thi ped toot ke sadak pe gir gaya, rasta pura block se koye nikal na sake.",
        "language_category": "haryanvi",
        "latitude": 28.4200, "longitude": 77.0350,
        "district_id": "HR-GU", "locality": "Sohna Road, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-TREE-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_tree_block.jpg"
    },
    {
        "id": "CMP-014",
        "title": "Transformer te dhuan uth rya se",
        "description": "Sector 14 transformer te aag ki chingariyan chhut ri se dhuan nikal rya h, bijli walo ne bhejo.",
        "language_category": "haryanvi",
        "latitude": 28.4720, "longitude": 77.0425,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-TRANSFORMER-01",
        "is_safety_critical": True,
        "adversarial_type": "SAME_LOCATION_DIFF_PROBLEM", # Same coords as CMP-001 but electrical!
        "photo_reference": "syn_transformer_fire.jpg"
    },
    {
        "id": "CMP-015",
        "title": "Gali me kachra sad rya se",
        "description": "Sector 14 gali 3 ke bahar kachre ka dher pada se kutton ne faila diya pura gandagi.",
        "language_category": "haryanvi",
        "latitude": 28.4720, "longitude": 77.0425,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-GUR-GARBAGE-SEC14",
        "is_safety_critical": False,
        "adversarial_type": "SAME_LOCATION_DIFF_PROBLEM", # Same coords as CMP-001 & CMP-014 but health!
        "photo_reference": "syn_sec14_garbage.jpg"
    },
    {
        "id": "CMP-016",
        "title": "Faridabad NIT 1 me paani jama",
        "description": "Bhai NIT 1 chowk pe ghutna bhar paani jama se 2 ghante se, gadiyan band ho ri se.",
        "language_category": "haryanvi",
        "latitude": 28.3980, "longitude": 77.3050,
        "district_id": "HR-FB", "locality": "NIT 1, Faridabad",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-FBD-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_fbd_nit_water.jpg"
    },
    {
        "id": "CMP-017",
        "title": "Machhar bohot ho gaye paani khada se",
        "description": "Karnal Kunjpura road pe khali plot me ganda paani bhar rya se machhar khaan lag gaye dengue hoga.",
        "language_category": "haryanvi",
        "latitude": 29.6850, "longitude": 76.9900,
        "district_id": "HR-KR", "locality": "Kunjpura Road, Karnal",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-KAR-DENGUE-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_karnal_mosquito.jpg"
    },
    {
        "id": "CMP-018",
        "title": "Hisar bus stand pe khadda",
        "description": "Hisar bus stand ke samne sadak dhas gayi se lamba chauda khadda ban gaya.",
        "language_category": "haryanvi",
        "latitude": 29.1530, "longitude": 75.7220,
        "district_id": "HR-HI", "locality": "Bus Stand, Hisar",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-HIS-SINKHOLE-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_hisar_sinkhole.jpg"
    },
    {
        "id": "CMP-019",
        "title": "Panchkula Sector 7 naali chok",
        "description": "Sector 7 market dhore naali band padi se pura ganda paani sadak pe bahe se.",
        "language_category": "haryanvi",
        "latitude": 30.6950, "longitude": 76.8520,
        "district_id": "HR-PK", "locality": "Sector 7, Panchkula",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-PAN-SEWER-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_panchkula_sewer.jpg"
    },
    {
        "id": "CMP-020",
        "title": "Ambala Cantt me bijli ka taar nanga",
        "description": "Ambala Cantt sadar bazar me nanga taar deewar pe chhu rya se bachhon ko khatra se jaldi aao.",
        "language_category": "haryanvi",
        "latitude": 30.3600, "longitude": 76.8350,
        "district_id": "HR-AM", "locality": "Sadar Bazar, Ambala Cantt",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-AMB-WIRE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_ambala_wire.jpg"
    },

    # =========================================================================
    # BATCH 2: STANDARD HINDI (20 reports: CMP-021 to CMP-040)
    # =========================================================================
    {
        "id": "CMP-021",
        "title": "सेक्टर 14 मुख्य मार्ग पर भारी जलभराव",
        "description": "सेक्टर 14 में भारी जलभराव के कारण दोपहिया वाहन बंद हो रहे हैं। नालियां पूरी तरह जाम हैं और जल निकासी की व्यवस्था नहीं है।",
        "language_category": "hindi",
        "latitude": 28.4721, "longitude": 77.0424,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hindi_sec14_water.jpg"
    },
    {
        "id": "CMP-022",
        "title": "सेक्टर 29 में बिजली का खंभा गिरा",
        "description": "सेक्टर 29 मुख्य चौराहे के पास बिजली का खंभा गिर गया है और 11केवी के जीवित तार सड़क पर फैले हुए हैं। भारी जनहानि की आशंका है।",
        "language_category": "hindi",
        "latitude": 28.4681, "longitude": 77.0621,
        "district_id": "HR-GU", "locality": "Sector 29, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-POLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hindi_pole_down.jpg"
    },
    {
        "id": "CMP-023",
        "title": "इफको चौक पर सड़क पर गहरा गड्ढा",
        "description": "इफको चौक के निकट सड़क पर 3 फीट गहरा गड्ढा हो गया है जिससे भारी ट्रैफिक जाम लगा है तथा दुर्घटना का जोखिम है।",
        "language_category": "hindi",
        "latitude": 28.4724, "longitude": 77.0726,
        "district_id": "HR-GU", "locality": "IFFCO Chowk, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-POTHOLE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hindi_iffco_pothole.jpg"
    },
    {
        "id": "CMP-024",
        "title": "डीएलएफ फेज 3 में कचरे का भारी ढेर",
        "description": "डीएलएफ फेज 3 में खुले मैदान में पिछले कई दिनों से कचरा जमा है, जिससे तीव्र दुर्गंध और संक्रामक बीमारियों का खतरा बढ़ रहा है।",
        "language_category": "hindi",
        "latitude": 28.4952, "longitude": 77.0902,
        "district_id": "HR-GU", "locality": "DLF Phase 3, Gurugram",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-GUR-GARBAGE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hindi_dlf_garbage.jpg"
    },
    {
        "id": "CMP-025",
        "title": "सुभाष चौक पेयजल पाइपलाइन टूटी",
        "description": "सुभाष चौक के पास मुख्य पेयजल पाइपलाइन फटने से लाखों लीटर स्वच्छ जल बहकर व्यर्थ हो रहा है और सड़क पर कटाव हो गया है।",
        "language_category": "hindi",
        "latitude": 28.4352, "longitude": 77.0411,
        "district_id": "HR-GU", "locality": "Subhash Chowk, Gurugram",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "INC-GUR-PIPE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hindi_pipe_burst.jpg"
    },
    {
        "id": "CMP-026",
        "title": "राजीव चौक अंडरपास में गाड़ियां डूबी",
        "description": "राजीव चौक अंडरपास में 4 फीट पानी भर चुका है और कई वाहन फंस गए हैं। तुरंत पंप लगाकर जल निकासी की जाए।",
        "language_category": "hindi",
        "latitude": 28.4552, "longitude": 77.0302,
        "district_id": "HR-GU", "locality": "Rajiv Chowk, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-UNDERPASS-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hindi_underpass.jpg"
    },
    {
        "id": "CMP-027",
        "title": "ओल्ड रेलवे रोड पर सीवर मैनहोल खुला",
        "description": "ओल्ड रेलवे रोड पर सीवर का ढक्कन गायब है। खुला मैनहोल राहगीरों और वाहनों के लिए जानलेवा साबित हो सकता है।",
        "language_category": "hindi",
        "latitude": 28.4652, "longitude": 77.0202,
        "district_id": "HR-GU", "locality": "Old Railway Road, Gurugram",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-GUR-SEWER-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hindi_manhole.jpg"
    },
    {
        "id": "CMP-028",
        "title": "सोहना रोड पर स्ट्रीट लाइट खराब",
        "description": "सोहना रोड मोड़ के पूरे स्ट्रेच पर स्ट्रीट लाइट बंद पड़ी हैं। रात में अंधेरे के कारण महिलाओं की सुरक्षा खतरे में है।",
        "language_category": "hindi",
        "latitude": 28.4102, "longitude": 77.0402,
        "district_id": "HR-GU", "locality": "Sohna Road, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-LIGHT-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hindi_dark_road.jpg"
    },
    {
        "id": "CMP-029",
        "title": "बादशाहपुर मुख्य नाला अवरुद्ध",
        "description": "बादशाहपुर ड्रेन में सिल्ट और कचरा फंसने से पानी ओवरफ्लो होकर रिहायशी कॉलोनियों की ओर बढ़ रहा है।",
        "language_category": "hindi",
        "latitude": 28.4022, "longitude": 77.0512,
        "district_id": "HR-GU", "locality": "Badshahpur, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-DRAIN-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hindi_drain.jpg"
    },
    {
        "id": "CMP-030",
        "title": "एमजी रोड पर सड़क टूटी हुई है",
        "description": "एमजी रोड मेट्रो पिलर 128 के नीचे सड़क पूरी तरह धंस चुकी है और डामर उखड़ गया है जिससे गाड़ियां रेंग रही हैं।",
        "language_category": "hindi",
        "latitude": 28.4790, "longitude": 77.0850,
        "district_id": "HR-GU", "locality": "MG Road, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-MGROAD-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hindi_mgroad.jpg"
    },
    {
        "id": "CMP-031",
        "title": "फरीदाबाद बल्लभगढ़ बस स्टैंड पर नाला चोक",
        "description": "बल्लभगढ़ बस स्टैंड के बाहर नाला चोक होने से गंदा पानी दुकानों के अंदर प्रवेश कर रहा है। व्यापार ठप है।",
        "language_category": "hindi",
        "latitude": 28.3410, "longitude": 77.3190,
        "district_id": "HR-FB", "locality": "Ballabgarh, Faridabad",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-FBD-BALLAB-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_fbd_ballab.jpg"
    },
    {
        "id": "CMP-032",
        "title": "पानीपत जीटी रोड पर भारी कचरा",
        "description": "पानीपत टोल प्लाजा के पास जीटी रोड किनारे कचरे में आग लगा दी गई है जिससे जहरीला धुआं फैल रहा है।",
        "language_category": "hindi",
        "latitude": 29.3900, "longitude": 76.9700,
        "district_id": "HR-PA", "locality": "GT Road, Panipat",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-PAN-FIRE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_panipat_smoke.jpg"
    },
    {
        "id": "CMP-033",
        "title": "सोनीपत सेक्टर 15 में ट्रांसफार्मर में स्पार्किंग",
        "description": "सेक्टर 15 सोनीपत में बिजली ट्रांसफार्मर में तेज चिंगारियां निकल रही हैं और विस्फोट की आवाजें आ रही हैं।",
        "language_category": "hindi",
        "latitude": 28.9950, "longitude": 77.0200,
        "district_id": "HR-SO", "locality": "Sector 15, Sonipat",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-SON-TRANS-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_sonipat_spark.jpg"
    },
    {
        "id": "CMP-034",
        "title": "यमुनानगर पुलिया की दीवार ढह गई",
        "description": "यमुनानगर जगाधरी मार्ग पर नहर की पुरानी पुलिया की सुरक्षा दीवार ढह गई है, वाहन नहर में गिरने का खतरा है।",
        "language_category": "hindi",
        "latitude": 30.1300, "longitude": 77.2900,
        "district_id": "HR-YN", "locality": "Jagadhri Road, Yamunanagar",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "INC-YAM-BRIDGE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_yamunanagar_culvert.jpg"
    },
    {
        "id": "CMP-035",
        "title": "रोहतक रेलवे स्टेशन रोड पर जलजमाव",
        "description": "रोहतक स्टेशन रोड पर वर्षा के जल का निकास न होने के कारण जलभराव हो गया है, यात्री परेशान हैं।",
        "language_category": "hindi",
        "latitude": 28.8920, "longitude": 76.5820,
        "district_id": "HR-RO", "locality": "Railway Road, Rohtak",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-ROH-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_rohtak_water.jpg"
    },
    {
        "id": "CMP-036",
        "title": "कुरुक्षेत्र पिपली रोड पर गड्ढे",
        "description": "पिपली चौक से कुरुक्षेत्र विश्वविद्यालय मार्ग पर जगह-जगह बड़े गड्ढे हो गए हैं, सड़क की तुरंत मरम्मत की जाए।",
        "language_category": "hindi",
        "latitude": 29.9700, "longitude": 76.8800,
        "district_id": "HR-KU", "locality": "Pipli Road, Kurukshetra",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-KUR-ROAD-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_kurukshetra_road.jpg"
    },
    {
        "id": "CMP-037",
        "title": "सिरसा बरनाला रोड पर खुला सीवर",
        "description": "बरनाला रोड सिरसा पर सीवर लाइन टूटने से सारा गंदा पानी मुख्य सड़क पर बह रहा है जिससे सड़ांध फैल गई है।",
        "language_category": "hindi",
        "latitude": 29.5400, "longitude": 75.0300,
        "district_id": "HR-SI", "locality": "Barnala Road, Sirsa",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-SIR-SEWER-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_sirsa_sewer.jpg"
    },
    {
        "id": "CMP-038",
        "title": "जींद बस स्टैंड के निकट गंदा कचरा",
        "description": "जींद नए बस स्टैंड के निकट सार्वजनिक मार्ग पर कचरे का अंबार लगा हुआ है, नगर परिषद द्वारा सफाई नहीं की जा रही।",
        "language_category": "hindi",
        "latitude": 29.3150, "longitude": 76.3200,
        "district_id": "HR-JI", "locality": "New Bus Stand, Jind",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-JIN-GARBAGE-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_jind_waste.jpg"
    },
    {
        "id": "CMP-039",
        "title": "रेवाड़ी बावल चौक पर बिजली का तार टूटा",
        "description": "बावल चौक रेवाड़ी पर आंधी के बाद बिजली का हाईटेंशन तार टूटकर सड़क पर गिर गया है, तुरंत लाइन काटी जाए।",
        "language_category": "hindi",
        "latitude": 28.1900, "longitude": 76.6200,
        "district_id": "HR-RE", "locality": "Bawal Chowk, Rewari",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-REW-WIRE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_rewari_wire.jpg"
    },
    {
        "id": "CMP-040",
        "title": "पंचकूला सेक्टर 14 में सड़क धंसी",
        "description": "पंचकूला सेक्टर 14 सामुदायिक केंद्र के पास बारिश के कारण सड़क धंस गई है और 5 फीट चौड़ा गड्ढा बन गया है।",
        "language_category": "hindi",
        "latitude": 30.6850, "longitude": 76.8600,
        "district_id": "HR-PK", "locality": "Sector 14, Panchkula",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-PAN-ROAD-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_panchkula_sink.jpg"
    },

    # =========================================================================
    # BATCH 3: HINGLISH / CODE-SWITCHING (20 reports: CMP-041 to CMP-060)
    # =========================================================================
    {
        "id": "CMP-041",
        "title": "Road pe heavy water logging hai",
        "description": "Sector 14 internal road pe massive water logging ho gayi hai, drains completely block hain and cars are stuck.",
        "language_category": "hinglish",
        "latitude": 28.4723, "longitude": 77.0426,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hinglish_water_sec14.jpg"
    },
    {
        "id": "CMP-042",
        "title": "Electric pole fall down ho gaya hai",
        "description": "Near Sector 29 market electric pole fall down ho gaya and live wires are lying on the road sparking rapidly.",
        "language_category": "hinglish",
        "latitude": 28.4683, "longitude": 77.0623,
        "district_id": "HR-GU", "locality": "Sector 29, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-POLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hinglish_pole_down.jpg"
    },
    {
        "id": "CMP-043",
        "title": "Huge pothole at IFFCO Chowk",
        "description": "IFFCO chowk flyover entry pe huge pothole create ho gaya hai, traffic jam ho raha hai and accidents are happening.",
        "language_category": "hinglish",
        "latitude": 28.4726, "longitude": 77.0727,
        "district_id": "HR-GU", "locality": "IFFCO Chowk, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-POTHOLE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hinglish_pothole.jpg"
    },
    {
        "id": "CMP-044",
        "title": "Garbage dumping site ban gaya hai DLF 3",
        "description": "DLF Phase 3 open plot mein garbage dump ho raha hai continuously, municipal truck nahi aa raha severe health risk.",
        "language_category": "hinglish",
        "latitude": 28.4951, "longitude": 77.0901,
        "district_id": "HR-GU", "locality": "DLF Phase 3, Gurugram",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-GUR-GARBAGE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hinglish_garbage.jpg"
    },
    {
        "id": "CMP-045",
        "title": "Water supply pipe burst near Subhash Chowk",
        "description": "Subhash Chowk junction pe main drinking water pipeline burst ho gayi hai, heavy water leakage on main road.",
        "language_category": "hinglish",
        "latitude": 28.4351, "longitude": 77.0412,
        "district_id": "HR-GU", "locality": "Subhash Chowk, Gurugram",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "INC-GUR-PIPE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hinglish_burst.jpg"
    },
    {
        "id": "CMP-046",
        "title": "Subhash chowk road blocked because of water leakage",
        "description": "Water leakage ki wajah se Subhash chowk road pe heavy mud create ho gaya aur traffic completely block hai.",
        "language_category": "hinglish",
        "latitude": 28.4353, "longitude": 77.0413,
        "district_id": "HR-GU", "locality": "Subhash Chowk, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-PIPE-01", # Related symptom / secondary consequence!
        "is_safety_critical": False,
        "adversarial_type": "RELATED_SYMPTOM",
        "photo_reference": "syn_hinglish_mud.jpg"
    },
    {
        "id": "CMP-047",
        "title": "Rajiv chowk underpass completely waterlogged",
        "description": "Rajiv Chowk underpass mein waist deep water level ho chuka hai, please deploy dewatering pumps urgently.",
        "language_category": "hinglish",
        "latitude": 28.4551, "longitude": 77.0301,
        "district_id": "HR-GU", "locality": "Rajiv Chowk, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-UNDERPASS-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hinglish_underpass.jpg"
    },
    {
        "id": "CMP-048",
        "title": "Old railway road open sewer manhole",
        "description": "Old Railway Road pe sewer manhole cover missing hai, ganda paani overflow ho raha hai dangerous spot.",
        "language_category": "hinglish",
        "latitude": 28.4651, "longitude": 77.0201,
        "district_id": "HR-GU", "locality": "Old Railway Road, Gurugram",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-GUR-SEWER-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hinglish_sewer.jpg"
    },
    {
        "id": "CMP-049",
        "title": "Sohna road streetlights totally blacked out",
        "description": "Complete blackout on Sohna road stretch after rain, all streetlights non functional highly unsafe at night.",
        "language_category": "hinglish",
        "latitude": 28.4101, "longitude": 77.0401,
        "district_id": "HR-GU", "locality": "Sohna Road, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-LIGHT-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hinglish_blackout.jpg"
    },
    {
        "id": "CMP-050",
        "title": "Badshahpur drain embankment breach risk",
        "description": "Badshahpur nala water level overflowing embankment, if not cleared immediately nearby societies flood ho jayengi.",
        "language_category": "hinglish",
        "latitude": 28.4021, "longitude": 77.0511,
        "district_id": "HR-GU", "locality": "Badshahpur, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-DRAIN-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hinglish_drain.jpg"
    },
    {
        "id": "CMP-051",
        "title": "MG road damaged asphalt and craters",
        "description": "MG Road near Metro pillar 128 has deep asphalt craters causing vehicle suspension damage and slow traffic.",
        "language_category": "hinglish",
        "latitude": 28.4791, "longitude": 77.0851,
        "district_id": "HR-GU", "locality": "MG Road, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-MGROAD-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_hinglish_mgroad.jpg"
    },
    {
        "id": "CMP-052",
        "title": "Faridabad Sector 15 transformer short circuit",
        "description": "Sector 15 market transformer continuously sparking and making loud blast sound, fire brigade and power dept alert karo.",
        "language_category": "hinglish",
        "latitude": 28.4150, "longitude": 77.3180,
        "district_id": "HR-FB", "locality": "Sector 15, Faridabad",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-FBD-TRANS-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hinglish_fbd_trans.jpg"
    },
    {
        "id": "CMP-053",
        "title": "Karnal Model Town garbage issue",
        "description": "Model Town Karnal community park corner pe huge biohazard waste dumped by unauthorized vendor, please inspect.",
        "language_category": "hinglish",
        "latitude": 29.6920, "longitude": 76.9850,
        "district_id": "HR-KR", "locality": "Model Town, Karnal",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-KAR-GARB-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_hinglish_karnal_park.jpg"
    },
    {
        "id": "CMP-054",
        "title": "Panipat toll plaza road damage",
        "description": "Panipat bypass road pe massive sinkhole develop ho gaya hai after rain, barricading required immediately.",
        "language_category": "hinglish",
        "latitude": 29.3880, "longitude": 76.9650,
        "district_id": "HR-PA", "locality": "Bypass Road, Panipat",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-PAN-SINK-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_hinglish_panipat_sink.jpg"
    },
    {
        "id": "CMP-055",
        "title": "Rohtak Medical Mor water logging",
        "description": "PGIMS Rohtak Medical Mor pe knee deep water logging hai, ambulance access severely hindered ho raha hai.",
        "language_category": "hinglish",
        "latitude": 28.8870, "longitude": 76.6120,
        "district_id": "HR-RO", "locality": "PGIMS Medical Mor, Rohtak",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-ROH-AMB-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hinglish_pgims.jpg"
    },
    {
        "id": "CMP-056",
        "title": "Hisar auto market sewer choke",
        "description": "Auto market Hisar mein sewer line block hone se dirty sewage water spread across shops, extreme bad smell.",
        "language_category": "hinglish",
        "latitude": 29.1480, "longitude": 75.7150,
        "district_id": "HR-HI", "locality": "Auto Market, Hisar",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-HIS-SEW-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_hinglish_hisar_auto.jpg"
    },
    {
        "id": "CMP-057",
        "title": "Sonipat Murthal dhaba road flyover expansion joint crack",
        "description": "Murthal flyover bridge expansion joint pe wide crack notice kiya hai, structure vibration abnormal lag rahi hai.",
        "language_category": "hinglish",
        "latitude": 29.0250, "longitude": 77.0700,
        "district_id": "HR-SO", "locality": "Murthal Flyover, Sonipat",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "INC-SON-BRIDGE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hinglish_flyover.jpg"
    },
    {
        "id": "CMP-058",
        "title": "Ambala City cloth market street light issue",
        "description": "Cloth market narrow lanes mein all municipal lights shut down for 3 days, pickpocketing and safety hazard.",
        "language_category": "hinglish",
        "latitude": 30.3780, "longitude": 76.7760,
        "district_id": "HR-AM", "locality": "Cloth Market, Ambala City",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-AMB-LIGHT-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_hinglish_ambala_cloth.jpg"
    },
    {
        "id": "CMP-059",
        "title": "Yamunanagar paper mill road drain overflowing",
        "description": "Paper mill road nala completely choked with industrial plastic, water flowing on road creating traffic hazard.",
        "language_category": "hinglish",
        "latitude": 30.1420, "longitude": 77.2850,
        "district_id": "HR-YN", "locality": "Paper Mill Road, Yamunanagar",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-YAM-MILL-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_hinglish_yamuna_mill.jpg"
    },
    {
        "id": "CMP-060",
        "title": "Panchkula Sector 20 high tension wire touching tree",
        "description": "Sector 20 Panchkula park near round-about high-tension wire is touching dry tree branch, spark and fire hazard.",
        "language_category": "hinglish",
        "latitude": 30.6720, "longitude": 76.8450,
        "district_id": "HR-PK", "locality": "Sector 20, Panchkula",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-PAN-WIRE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_hinglish_panch_wire.jpg"
    },

    # =========================================================================
    # BATCH 4: INFORMAL / TYPOS / ABBREVIATIONS / SLANG (20 reports: CMP-061 to CMP-080)
    # =========================================================================
    {
        "id": "CMP-061",
        "title": "paani bhar gya bhout ganda sadk pr",
        "description": "sec 14 me pani bhr gya bht jada car band pd gyi nikalna muskil h jldi aao",
        "language_category": "informal_typos",
        "latitude": 28.4721, "longitude": 77.0425,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_typo_water.jpg"
    },
    {
        "id": "CMP-062",
        "title": "khamba gir gya light chli gyi",
        "description": "sec 29 me pole gir gya h taar toota pda h raste me sparking hori danger h",
        "language_category": "informal_typos",
        "latitude": 28.4682, "longitude": 77.0621,
        "district_id": "HR-GU", "locality": "Sector 29, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-POLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_typo_pole.jpg"
    },
    {
        "id": "CMP-063",
        "title": "gdha bhot bda h gadi fas gyi",
        "description": "iffco chwk pr bhot bda gaddha h bike wle gir rhe h road tut gyi h",
        "language_category": "informal_typos",
        "latitude": 28.4725, "longitude": 77.0726,
        "district_id": "HR-GU", "locality": "IFFCO Chowk, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-POTHOLE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_typo_pothole.jpg"
    },
    {
        "id": "CMP-064",
        "title": "kuda pda h bimar hojenge sb",
        "description": "dlf ph 3 me khrab kachra pda h kutto ne phelaya h bhot bdbu ari h",
        "language_category": "informal_typos",
        "latitude": 28.4952, "longitude": 77.0901,
        "district_id": "HR-GU", "locality": "DLF Phase 3, Gurugram",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-GUR-GARBAGE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_typo_garbage.jpg"
    },
    {
        "id": "CMP-065",
        "title": "pipe ftt gya pura pani beh ra",
        "description": "subhash chawk pe water supply ka mota pipe leak ho rha h bht speed se",
        "language_category": "informal_typos",
        "latitude": 28.4351, "longitude": 77.0410,
        "district_id": "HR-GU", "locality": "Subhash Chowk, Gurugram",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "INC-GUR-PIPE-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_typo_pipe.jpg"
    },
    {
        "id": "CMP-066",
        "title": "undrpas doob gya",
        "description": "rajiv chok undrpass ful paani h bus fas gyi koi mat jao",
        "language_category": "informal_typos",
        "latitude": 28.4551, "longitude": 77.0302,
        "district_id": "HR-GU", "locality": "Rajiv Chowk, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-UNDERPASS-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_typo_underpass.jpg"
    },
    {
        "id": "CMP-067",
        "title": "gutar khula h bacha gir jega",
        "description": "old rly rd pe sewer ka dhkn tuta h khula pada h gnda pani ara h",
        "language_category": "informal_typos",
        "latitude": 28.4651, "longitude": 77.0202,
        "district_id": "HR-GU", "locality": "Old Railway Road, Gurugram",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-GUR-SEWER-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_typo_gutar.jpg"
    },
    {
        "id": "CMP-068",
        "title": "andhera h sohna rd pe light khrb",
        "description": "sohna rod turn pe sb lite bnd h kuch dikh ni rha accident ho rhe",
        "language_category": "informal_typos",
        "latitude": 28.4101, "longitude": 77.0402,
        "district_id": "HR-GU", "locality": "Sohna Road, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-LIGHT-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_typo_light.jpg"
    },
    {
        "id": "CMP-069",
        "title": "nala overflow hora bht jada",
        "description": "badshapur nala bhr gya ghr me paani aane lga se bachao",
        "language_category": "informal_typos",
        "latitude": 28.4021, "longitude": 77.0512,
        "district_id": "HR-GU", "locality": "Badshahpur, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-DRAIN-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_typo_drain.jpg"
    },
    {
        "id": "CMP-070",
        "title": "mg rod rd khrab h bht gaddha",
        "description": "mg road piller 128 pe bhot khadde h gadi chlana muskil ho rha",
        "language_category": "informal_typos",
        "latitude": 28.4792, "longitude": 77.0852,
        "district_id": "HR-GU", "locality": "MG Road, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-MGROAD-01",
        "is_safety_critical": False,
        "adversarial_type": "MULTI_DIALECT_SAME_EVENT",
        "photo_reference": "syn_typo_mgroad.jpg"
    },
    {
        "id": "CMP-071",
        "title": "bjl transformer me aag lgi",
        "description": "fbd sec 16 trnsfrmr me fire lg gyi smoke nikl rha bhot blast h",
        "language_category": "informal_typos",
        "latitude": 28.4120, "longitude": 77.3150,
        "district_id": "HR-FB", "locality": "Sector 16, Faridabad",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-FBD-TRANS-02",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_typo_blast.jpg"
    },
    {
        "id": "CMP-072",
        "title": "nalii block haii smell arhi",
        "description": "rohtak railway station gali 2 me nali jam h kida ghum ra",
        "language_category": "informal_typos",
        "latitude": 28.8910, "longitude": 76.5810,
        "district_id": "HR-RO", "locality": "Railway Station, Rohtak",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-ROH-SEW-02",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_typo_smell.jpg"
    },
    {
        "id": "CMP-073",
        "title": "sadak pe ped gira block h",
        "description": "karnal sector 6 rd pr tree gira pda h rasta bnd h jldi htao",
        "language_category": "informal_typos",
        "latitude": 29.6810, "longitude": 76.9780,
        "district_id": "HR-KR", "locality": "Sector 6, Karnal",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-KAR-TREE-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_typo_tree.jpg"
    },
    {
        "id": "CMP-074",
        "title": "manhole dhkan ni h khula",
        "description": "panipat court road manhole khula pda h koi mar jaega",
        "language_category": "informal_typos",
        "latitude": 29.3950, "longitude": 76.9750,
        "district_id": "HR-PA", "locality": "Court Road, Panipat",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-PAN-MANHOLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_typo_court.jpg"
    },
    {
        "id": "CMP-075",
        "title": "taar latk ra h current lg skta h",
        "description": "hisar rajgarh road tar latak rha h bike wale ko lgte lgte bcha",
        "language_category": "informal_typos",
        "latitude": 29.1350, "longitude": 75.7280,
        "district_id": "HR-HI", "locality": "Rajgarh Road, Hisar",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-HIS-WIRE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_typo_wire_hisar.jpg"
    },
    {
        "id": "CMP-076",
        "title": "kachra ka dher h bura hal",
        "description": "sonipat bus adda kachra bhot h safari nhi hoti 10 din se",
        "language_category": "informal_typos",
        "latitude": 28.9890, "longitude": 77.0150,
        "district_id": "HR-SO", "locality": "Bus Stand, Sonipat",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-SON-GARB-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_typo_son_garb.jpg"
    },
    {
        "id": "CMP-077",
        "title": "pani bhara gya pura market me",
        "description": "ambala cantt grain market me barish ka pani dukan me ghusa",
        "language_category": "informal_typos",
        "latitude": 30.3550, "longitude": 76.8400,
        "district_id": "HR-AM", "locality": "Grain Market, Ambala Cantt",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-AMB-GRAIN-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_typo_grain.jpg"
    },
    {
        "id": "CMP-078",
        "title": "sadk tut gyi gaddhe hi gaddhe",
        "description": "yamunanagar station road tuti padi h sab gaddhe h dhool ud ri",
        "language_category": "informal_typos",
        "latitude": 30.1250, "longitude": 77.2750,
        "district_id": "HR-YN", "locality": "Station Road, Yamunanagar",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-YAM-ROAD-01",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_typo_yam_road.jpg"
    },
    {
        "id": "CMP-079",
        "title": "sewer overflo hora h pani ganda",
        "description": "panchkula sec 19 me gutter overflow h charo trf badbu h",
        "language_category": "informal_typos",
        "latitude": 30.6800, "longitude": 76.8400,
        "district_id": "HR-PK", "locality": "Sector 19, Panchkula",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-PAN-SEWER-02",
        "is_safety_critical": False,
        "adversarial_type": "NORMAL",
        "photo_reference": "syn_typo_panch_sewer.jpg"
    },
    {
        "id": "CMP-080",
        "title": "khamba tedha h girne wala h",
        "description": "bhiwani loharu road bijli khamba pura jhuka h kbi b gir skta",
        "language_category": "informal_typos",
        "latitude": 28.7850, "longitude": 76.1300,
        "district_id": "HR-BH", "locality": "Loharu Road, Bhiwani",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-BHI-POLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": "syn_typo_pole_bhiwani.jpg"
    },

    # =========================================================================
    # BATCH 5: VAGUE / SHORT / AMBIGUOUS / PHRASED (20 reports: CMP-081 to CMP-100)
    # =========================================================================
    {
        "id": "CMP-081",
        "title": "paani",
        "description": "Sector 14 paani",
        "language_category": "vague_ambiguous",
        "latitude": 28.4720, "longitude": 77.0425,
        "district_id": "HR-GU", "locality": "Sector 14, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-WATER-01",
        "is_safety_critical": False,
        "adversarial_type": "VAGUE_SHORT",
        "photo_reference": None
    },
    {
        "id": "CMP-082",
        "title": "danger",
        "description": "sector 29 live wire spark",
        "language_category": "vague_ambiguous",
        "latitude": 28.4680, "longitude": 77.0620,
        "district_id": "HR-GU", "locality": "Sector 29, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-POLE-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": None
    },
    {
        "id": "CMP-083",
        "title": "pothole",
        "description": "iffco chowk road",
        "language_category": "vague_ambiguous",
        "latitude": 28.4725, "longitude": 77.0725,
        "district_id": "HR-GU", "locality": "IFFCO Chowk, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-POTHOLE-01",
        "is_safety_critical": False,
        "adversarial_type": "VAGUE_SHORT",
        "photo_reference": None
    },
    {
        "id": "CMP-084",
        "title": "garbage",
        "description": "dlf phase 3 plot waste",
        "language_category": "vague_ambiguous",
        "latitude": 28.4950, "longitude": 77.0900,
        "district_id": "HR-GU", "locality": "DLF Phase 3, Gurugram",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "INC-GUR-GARBAGE-01",
        "is_safety_critical": False,
        "adversarial_type": "VAGUE_SHORT",
        "photo_reference": None
    },
    {
        "id": "CMP-085",
        "title": "pipe leak",
        "description": "subhash chowk paani nikal raha",
        "language_category": "vague_ambiguous",
        "latitude": 28.4350, "longitude": 77.0410,
        "district_id": "HR-GU", "locality": "Subhash Chowk, Gurugram",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "INC-GUR-PIPE-01",
        "is_safety_critical": False,
        "adversarial_type": "VAGUE_SHORT",
        "photo_reference": None
    },
    {
        "id": "CMP-086",
        "title": "underpass",
        "description": "rajiv chowk band hai paani ki wajah se",
        "language_category": "vague_ambiguous",
        "latitude": 28.4550, "longitude": 77.0300,
        "district_id": "HR-GU", "locality": "Rajiv Chowk, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-UNDERPASS-01",
        "is_safety_critical": False,
        "adversarial_type": "VAGUE_SHORT",
        "photo_reference": None
    },
    {
        "id": "CMP-087",
        "title": "sewer",
        "description": "old railway road manhole problem",
        "language_category": "vague_ambiguous",
        "latitude": 28.4650, "longitude": 77.0200,
        "district_id": "HR-GU", "locality": "Old Railway Road, Gurugram",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "INC-GUR-SEWER-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": None
    },
    {
        "id": "CMP-088",
        "title": "andhera",
        "description": "sohna road lights not working",
        "language_category": "vague_ambiguous",
        "latitude": 28.4100, "longitude": 77.0400,
        "district_id": "HR-GU", "locality": "Sohna Road, Gurugram",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "INC-GUR-LIGHT-01",
        "is_safety_critical": False,
        "adversarial_type": "VAGUE_SHORT",
        "photo_reference": None
    },
    {
        "id": "CMP-089",
        "title": "drain overflow",
        "description": "badshahpur paani",
        "language_category": "vague_ambiguous",
        "latitude": 28.4020, "longitude": 77.0510,
        "district_id": "HR-GU", "locality": "Badshahpur, Gurugram",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "INC-GUR-DRAIN-01",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": None
    },
    {
        "id": "CMP-090",
        "title": "craters",
        "description": "mg road metro pillar 128",
        "language_category": "vague_ambiguous",
        "latitude": 28.4790, "longitude": 77.0850,
        "district_id": "HR-GU", "locality": "MG Road, Gurugram",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "INC-GUR-MGROAD-01",
        "is_safety_critical": False,
        "adversarial_type": "VAGUE_SHORT",
        "photo_reference": None
    },
    {
        "id": "CMP-091",
        "title": "urgent help",
        "description": "yahan bohot paani bhar gaya hai koi bachao",
        "language_category": "vague_ambiguous",
        "latitude": 28.4500, "longitude": 77.0200, # Missing clear landmark
        "district_id": "HR-GU", "locality": "Gurugram Unknown Area",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_NO_LANDMARK",
        "photo_reference": None
    },
    {
        "id": "CMP-092",
        "title": "dikat h yha",
        "description": "bohot problem chal rahi hai log pareshan hain",
        "language_category": "vague_ambiguous",
        "latitude": 28.4300, "longitude": 77.0100,
        "district_id": "HR-GU", "locality": "Gurugram Unknown Area",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_NO_CATEGORY",
        "photo_reference": None
    },
    {
        "id": "CMP-093",
        "title": "road issue",
        "description": "road damaged please fix",
        "language_category": "vague_ambiguous",
        "latitude": 28.4400, "longitude": 77.0500,
        "district_id": "HR-GU", "locality": "Gurugram Highway",
        "issue_category": "ROAD_BLOCKAGE",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_GENERIC",
        "photo_reference": None
    },
    {
        "id": "CMP-094",
        "title": "current lag sakta hai",
        "description": "taar khuli hai",
        "language_category": "vague_ambiguous",
        "latitude": 28.4600, "longitude": 77.0700,
        "district_id": "HR-GU", "locality": "Gurugram Area",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": None
    },
    {
        "id": "CMP-095",
        "title": "smell",
        "description": "kachra and dirty smell badboo",
        "language_category": "vague_ambiguous",
        "latitude": 28.4800, "longitude": 77.0600,
        "district_id": "HR-GU", "locality": "Gurugram Area",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_GENERIC",
        "photo_reference": None
    },
    {
        "id": "CMP-096",
        "title": "choked",
        "description": "gutter choked",
        "language_category": "vague_ambiguous",
        "latitude": 28.4200, "longitude": 77.0400,
        "district_id": "HR-GU", "locality": "Gurugram Area",
        "issue_category": "SEWERAGE_OVERFLOW",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_GENERIC",
        "photo_reference": None
    },
    {
        "id": "CMP-097",
        "title": "bridge problem",
        "description": "flyover crack vibration",
        "language_category": "vague_ambiguous",
        "latitude": 28.4900, "longitude": 77.0800,
        "district_id": "HR-GU", "locality": "Gurugram Flyover",
        "issue_category": "CIVIL_INFRASTRUCTURE",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": True,
        "adversarial_type": "SAFETY_CRITICAL",
        "photo_reference": None
    },
    {
        "id": "CMP-098",
        "title": "bijli band",
        "description": "no power light nahi hai",
        "language_category": "vague_ambiguous",
        "latitude": 28.4000, "longitude": 77.0300,
        "district_id": "HR-GU", "locality": "Gurugram Colony",
        "issue_category": "ELECTRICAL_HAZARD",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_GENERIC",
        "photo_reference": None
    },
    {
        "id": "CMP-099",
        "title": "dengue case",
        "description": "machhar stagnant water dengue alert",
        "language_category": "vague_ambiguous",
        "latitude": 28.4100, "longitude": 77.0200,
        "district_id": "HR-GU", "locality": "Gurugram Sector",
        "issue_category": "HEALTH_HAZARD",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_GENERIC",
        "photo_reference": None
    },
    {
        "id": "CMP-100",
        "title": "water problem",
        "description": "water everywhere",
        "language_category": "vague_ambiguous",
        "latitude": 28.4700, "longitude": 77.0500,
        "district_id": "HR-GU", "locality": "Gurugram Area",
        "issue_category": "URBAN_FLOODING",
        "ground_truth_incident_id": "AMBIGUOUS",
        "is_safety_critical": False,
        "adversarial_type": "AMBIGUOUS_GENERIC",
        "photo_reference": None
    },
]

def generate():
    # 1. Verify exact counts
    assert len(COMPLAINTS) == 100, f"Expected exactly 100 complaints, got {len(COMPLAINTS)}"
    
    counts = {}
    for c in COMPLAINTS:
        lang = c["language_category"]
        counts[lang] = counts.get(lang, 0) + 1
    
    print("Language/Style Category Counts:", counts)
    for lang, count in counts.items():
        assert count == 20, f"Category {lang} has {count} items, expected 20!"

    # 2. Save dataset_100.json
    dataset_file = OUT_DIR / "dataset_100.json"
    with open(dataset_file, "w", encoding="utf-8") as f:
        json.dump(COMPLAINTS, f, indent=2, ensure_ascii=False)
    print(f"Saved {dataset_file}")

    # 3. Generate Ground Truth Pairwise Labels (4,950 pairs)
    # Ground truth relationship categories:
    # A. SAME_INCIDENT: both reports share same specific incident ID (non-ambiguous)
    # B. RELATED_SYMPTOM: shared causal link/symptom (e.g. pipe burst -> mud blockage)
    # C. SAME_LOCATION_DIFF_INCIDENT: within 100m, but different incident ID / category
    # D. DIFFERENT_INCIDENT: different incidents, far or unrelated
    # E. AMBIGUOUS: one or both reports lack sufficient context
    from app.services.fusion_engine import haversine_distance_m

    pairs = []
    same_incident_count = 0
    same_loc_diff_inc_count = 0
    related_symptom_count = 0
    different_incident_count = 0
    ambiguous_count = 0

    for i in range(len(COMPLAINTS)):
        for j in range(i + 1, len(COMPLAINTS)):
            c1 = COMPLAINTS[i]
            c2 = COMPLAINTS[j]

            dist = haversine_distance_m(c1["latitude"], c1["longitude"], c2["latitude"], c2["longitude"])

            inc1 = c1["ground_truth_incident_id"]
            inc2 = c2["ground_truth_incident_id"]

            if inc1 == "AMBIGUOUS" or inc2 == "AMBIGUOUS":
                rel = "AMBIGUOUS"
                ambiguous_count += 1
            elif inc1 == inc2:
                if c1.get("adversarial_type") == "RELATED_SYMPTOM" or c2.get("adversarial_type") == "RELATED_SYMPTOM":
                    rel = "RELATED_SYMPTOMS"
                    related_symptom_count += 1
                else:
                    rel = "SAME_INCIDENT"
                    same_incident_count += 1
            elif dist <= 100.0:
                rel = "SAME_LOCATION_DIFF_INCIDENT"
                same_loc_diff_inc_count += 1
            else:
                rel = "DIFFERENT_INCIDENT"
                different_incident_count += 1

            pairs.append({
                "report_a_id": c1["id"],
                "report_b_id": c2["id"],
                "ground_truth_relation": rel,
                "distance_m": round(dist, 1),
                "is_same_incident": bool(rel == "SAME_INCIDENT")
            })

    assert len(pairs) == 4950, f"Expected 4950 pairs, got {len(pairs)}"
    print(f"Generated 4,950 pairs: SAME_INCIDENT={same_incident_count}, SAME_LOC_DIFF={same_loc_diff_inc_count}, RELATED={related_symptom_count}, DIFF={different_incident_count}, AMBIGUOUS={ambiguous_count}")

    gt_file = OUT_DIR / "ground_truth.json"
    with open(gt_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_complaints": 100,
            "total_pairs": 4950,
            "metrics_breakdown": {
                "same_incident_pairs": same_incident_count,
                "same_location_different_incident_pairs": same_loc_diff_inc_count,
                "related_symptom_pairs": related_symptom_count,
                "different_incident_pairs": different_incident_count,
                "ambiguous_pairs": ambiguous_count
            },
            "pairs": pairs
        }, f, indent=2, ensure_ascii=False)
    print(f"Saved {gt_file}")

if __name__ == "__main__":
    generate()
